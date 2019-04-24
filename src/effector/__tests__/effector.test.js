//@flow

import {from, periodic} from 'most'

import {combine} from '..'

import {createDomain} from 'effector/domain'
import {createEvent, fromObservable} from 'effector/event'
import {createStore, createStoreObject} from 'effector/store'

test('will run in expected order', () => {
  const spy = jest.fn()
  const reset = createEvent('reset')
  const add = createEvent('add')
  const mult = createEvent('mult')
  const listSize = createStore(3)
    .on(add, (n, nn) => n + nn)
    .on(mult, (n, q) => n * q)
    .reset(reset)

  // const halt = add.link(
  //  mult, n => n%10, n => n + 10
  // )
  const currentList = createStore([])
    .on(add, (list, pl) => [...list, {add: pl}])
    .on(mult, (list, pl) => [...list, {mult: pl}])
    .reset(reset)
  const selected = createStore([])

  createStoreObject({listSize, currentList, selected})

  const unsub = currentList.subscribe(state => spy(state))
  add(5)
  mult(4)
  unsub()
  // halt()

  expect(spy.mock.calls).toEqual([[[]], [[{add: 5}]], [[{add: 5}, {mult: 4}]]])
  expect(spy).toHaveBeenCalledTimes(3)
})

test('reducer defaults', () => {
  const fn1 = jest.fn()
  const fn2 = jest.fn()
  const fn3 = jest.fn()
  const add = createEvent('add')
  const sub = createEvent('sub')
  const state1 = createStore(3)
    .on(add, (state, payload, type) => {
      fn1(state, payload, type)
    })
    .on(sub, (state, payload, type) => {
      fn2(state, payload, type)
      return state - payload
    })
  state1.watch(fn3)
  sub(1)
  add(10)
  add(2)
  expect({
    add: fn1.mock.calls,
    sub: fn2.mock.calls,
    watch: fn3.mock.calls,
    state: state1.getState(),
  }).toMatchSnapshot()
})

test('store.reset(event)', () => {
  const spy = jest.fn()
  const reset = createEvent('reset')
  const inc = createEvent('inc')
  const listSize = createStore(3)
    .on(inc, n => n + 1)
    .reset(reset)
  const currentList = createStore(
    Array.from({length: listSize.getState()}, (_, n) => n),
  )
    .on(inc, list => [...list, list.length])
    .reset(reset)
  const selected = createStore([])

  createStoreObject({listSize, currentList, selected})

  const unsub = currentList.subscribe(state => spy(state))
  inc()
  reset()
  unsub()

  expect(spy.mock.calls).toEqual([[[0, 1, 2]], [[0, 1, 2, 3]], [[0, 1, 2]]])
  expect(spy).toHaveBeenCalledTimes(3)
})

test('combine', () => {
  const spy = jest.fn()
  const inc = createEvent('inc')
  const dec = createEvent('dec')
  const s1 = createStore(0)
  const s2 = createStore(0)
  const s3 = createStore(0)
  const s4 = createStore(0)
  const result = combine(s1, s2, s3, s4, (a, b, c, d) => ({a, b, c, d}))
  result.watch(spy)
  s1.on(inc, _ => _ + 1).on(dec, _ => _ - 10)
  s2.on(inc, _ => _ + 10).on(dec, _ => _ - 1)

  expect(result.getState()).toMatchObject({a: 0, b: 0, c: 0, d: 0})

  inc()
  dec()
  expect(result.getState()).toMatchObject({a: -9, b: 9, c: 0, d: 0})

  expect(spy).toHaveBeenCalledTimes(3)
  // expect(fn).toHaveBeenCalledTimes(5)
})

test('no dull updates', () => {
  const store = createStore(false)
  const e1 = createEvent('e1')
  const e2 = createEvent('e2')
  const fn1 = jest.fn()
  const fn2 = jest.fn()
  const fn3 = jest.fn()
  store.watch(fn1)
  store.on(e1, (_, payload): boolean => payload)
  store.on(e2, (_, p) => _ === p)
  const nextStore = store.map(x => (fn2(x), x))
  nextStore.watch(fn3)
  store.watch(e => {})
  // nextStore.watch(e => console.log('next store', e))
  e1(false)
  e1(true)
  e1(false)
  e2(false)
  e2(false)
  expect(fn1.mock.calls).toMatchSnapshot()
  expect(fn2.mock.calls).toMatchSnapshot()
  expect(fn3.mock.calls).toMatchSnapshot()
  expect(fn1).toHaveBeenCalledTimes(5)
  expect(fn2).toHaveBeenCalledTimes(5)
  expect(fn3).toHaveBeenCalledTimes(5)
})

test('smoke', async() => {
  const used = jest.fn(x => Promise.resolve(x))
  const usedDone = jest.fn(x => Promise.resolve(x))
  const domain = createDomain('smoke')

  const effect = domain.effect('eff')
  effect.use(used)
  effect.done.watch(usedDone)
  const event = domain.event('event1')
  expect(effect).toBeDefined()
  expect(event).toBeDefined()
  event('bar')
  await effect('foo')
  expect(used).toHaveBeenCalledTimes(1)
  expect(usedDone).toHaveBeenCalledTimes(1)
})

//TODO Add port throws handling
describe('port', () => {
  test('port should work correctly', async() => {
    const used = jest.fn(state => {})
    const usedEff = jest.fn(state => {})
    const domain = createDomain()
    const event = domain.event('port-event')
    const eff = domain.event('port-effect')
    event.watch(used)
    eff.watch(usedEff)
    const str$ = periodic(100)
      .scan((a /*, b*/) => a + 1, 0)
      .take(10)

    // .map(event)

    str$.map(event).drain()
    await new Promise(rs => setTimeout(rs, 1500))
    expect(used).toHaveBeenCalledTimes(10)

    str$.map(eff).drain()
    await new Promise(rs => setTimeout(rs, 1500))
    expect(usedEff).toHaveBeenCalledTimes(10)
  })
})

it('works with most use cases', async() => {
  const spy = jest.fn()
  const timeout = createEvent('timeout')
  timeout.watch(spy)

  await periodic(300)
    .take(5)
    .observe(() => timeout())

  expect(spy).toHaveBeenCalledTimes(5)
})

test.skip('fromObservable supports own events as sources', async() => {
  const used = jest.fn(x => Promise.resolve(x))
  const usedDone = jest.fn(x => Promise.resolve(x))
  const domain = createDomain()

  const effect = domain.effect('eff')
  effect.use(used)
  effect.done.watch(usedDone)
  const event = domain.event('event1')
  fromObservable<string>(event).watch(e => effect(e))
  await event('ev')
  expect(used).toHaveBeenCalledTimes(1)
  expect(usedDone).toHaveBeenCalledTimes(1)
})
declare var epic: Function
//TODO WTF?
test.skip('hot reload support', async() => {
  // const fn = jest.fn()
  const fnA = jest.fn()
  const fnB = jest.fn()
  const used = jest.fn(x => Promise.resolve(x))
  const usedDone = jest.fn(x => Promise.resolve(x))
  const domain = createDomain()
  const storeA = domain.store({foo: 'bar'})
  storeA.watch((s, x) => (fnA(x), s))

  const effect = domain.effect('eff')
  effect.use(used)
  effect.done.watch(usedDone)
  const event = domain.event('event1')
  epic(event, data$ => data$.map(e => effect(e)))
  await event('ev')
  expect(used).toHaveBeenCalledTimes(1)
  expect(usedDone).toHaveBeenCalledTimes(1)

  const storeB = domain.store({foo: 'bar'})
  storeB.watch((s, x) => (fnB(x), s))

  await event('ev')
  expect(used).toHaveBeenCalledTimes(2)
  expect(usedDone).toHaveBeenCalledTimes(2)
  expect(fnA).toHaveBeenCalledTimes(5)
  expect(fnB).toHaveBeenCalledTimes(4)
})

/*
test('typeConstant', async() => {
 const fn = jest.fn()
 const used = jest.fn((x: string) => console.log(x))
 const respFn = jest.fn(x => console.log(x))
 const domain = createDomain('with-prefix')
 const store = domain.store({foo: 'bar'})
 const event = domain.typeConstant('TYPE_CONST')
 const eventResp = domain.typeConstant('RESP')
 eventResp.watch(respFn)
 expect(event.getType()).toBe('TYPE_CONST')
 event.epic(data$ =>
  data$.map(e => {
   used(e)
   return eventResp(e)
  }),
 )

 log`type constant's event`(event)
 store.dispatch({type: 'TYPE_CONST', payload: 'raw'})
 expect(event('test')).toMatchObject({type: 'TYPE_CONST', payload: 'test'})
 expect(event).toBeDefined()
 await event('run')
 await delay(500)
 expect(respFn).toHaveBeenCalledTimes(2)
 expect(used).toHaveBeenCalledTimes(2)
 expect(used.mock.calls).toMatchObject(
  //$ off
  [['raw'], ['run']],
 )
})
*/
test('subscription', async() => {
  const spy = jest.fn()
  const domain = createDomain()

  const eff = domain.effect('TYPE_CONST')
  expect(() => {
    from(eff).observe(spy)
  }).not.toThrow()
  const event = domain.event('ev')
  expect(() => {
    from(event).observe(spy)
  }).not.toThrow()
  await event('')
  await eff('')
  expect(spy).toHaveBeenCalledTimes(2)
})
