//@flow

import {createEvent} from 'effector/event'
import {createStore} from '..'

it('supports stores', () => {
  const spy = jest.fn()
  const newWord = createEvent<string>('new word')
  const a = createStore('word').on(newWord, (_, word) => word)

  const b = createStore(['word'])

  b.on(a, (b, a) => {
    spy(b, a)
    return [...b, a]
  })

  newWord('lol')
  expect(spy).toHaveBeenCalledTimes(1)

  newWord('')
  expect(spy).toHaveBeenCalledTimes(2)
  newWord(' ')
  expect(spy).toHaveBeenCalledTimes(3)

  newWord('long word')
  expect(spy).toHaveBeenCalledTimes(4)
  expect(spy.mock.calls).toEqual([
    [['word'], 'lol'],
    [['word', 'lol'], ''],
    [['word', 'lol', ''], ' '],
    [['word', 'lol', '', ' '], 'long word'],
  ])
})
it('supports events', () => {
  const spy = jest.fn()
  const trigger = createEvent('trigger')

  const b = createStore(0)

  b.on(trigger, (b, trigger) => {
    spy(b, trigger)
    return b + 1
  })

  trigger('lol')
  expect(spy).toHaveBeenCalledTimes(1)

  trigger('')
  expect(spy).toHaveBeenCalledTimes(2)
  trigger(' ')
  expect(spy).toHaveBeenCalledTimes(3)

  trigger('long word')
  expect(spy).toHaveBeenCalledTimes(4)
  expect(spy.mock.calls).toEqual([
    [0, 'lol'],
    [1, ''],
    [2, ' '],
    [3, 'long word'],
  ])
})
it('replace old links', () => {
  const event = createEvent('event')

  const store = createStore('')
    .on(event, () => 'a')
    .on(event, () => 'b')

  event()

  expect(store.getState()).toBe('b')

  store.off(event)

  store.setState('x')

  event()

  expect(store.getState()).toBe('x')
})
// it('supports effects', () => {
//   const spy = jest.fn()
//   const newWord = createEvent<string>('new word')
//   const spyEvent = createEffect('spy effect')
//   spyEvent.use(args => (console.log(args), args))
//   const a = createStore('word').on(newWord, (_, word) => word)

//   const b = a.map(word => word.length)

//   const sum = b.map((ln, prevLn) => ln + prevLn, 0)

//   sum.watch(spyEvent, (store, event) => spy(store, event))

//   newWord('lol')
//   expect(spy).toHaveBeenCalledTimes(0)
//   spyEvent(1)
//   spyEvent(2)
//   expect(spy).toHaveBeenCalledTimes(2)

//   newWord('')
//   expect(spy).toHaveBeenCalledTimes(2)
//   newWord(' ')
//   expect(spy).toHaveBeenCalledTimes(2)

//   spyEvent(3)
//   newWord('long word')
//   expect(spy).toHaveBeenCalledTimes(3)
//   expect(spy.mock.calls).toEqual([[7, 1], [7, 2], [8, 3]])
// })
