//@flow

import warning from 'warning'
import type {Effect} from './index.h'
import {Kind} from 'effector/stdlib'

import {step} from 'effector/stdlib'
import {eventFabric, type Event} from 'effector/event'
import type {EffectConfigPart} from '../config'

function OnResolve(result) {
  const {event, params, handler} = this
  //prettier-ignore
  event({
    handler,
    toHandler: result,
    result: {
      params,
      result,
    },
  })
}
function OnReject(error) {
  const {event, params, handler} = this
  //prettier-ignore
  event({
    handler,
    toHandler: error,
    result: {
      params,
      error,
    },
  })
}

function Def() {
  /*::
  this.rs = result => {}
  this.rj = error => {}
  */
  this.req = new Promise((rs, rj) => {
    this.rs = rs
    this.rj = rj
  })
}

const notifyHandler = step.run({
  fn({handler, toHandler, result}, scope) {
    handler(toHandler)
    return result
  },
})
export function effectFabric<Payload, Done>({
  name,
  config,
}: {
  name?: string,
  config: EffectConfigPart<Payload, Done>,
}): Effect<Payload, Done, *> {
  const {handler} = config

  //$off
  const instance: Effect<Payload, Done, any> = eventFabric({
    name,
    config,
  })

  const eventCreate = instance.create
  const done: Event<{params: Payload, result: Done}> = eventFabric({
    name: '' + instance.shortName + ' done',
    config,
  })
  const fail: Event<{params: Payload, error: *}> = eventFabric({
    name: '' + instance.shortName + ' fail',
    config,
  })
  done.graphite.seq.push(notifyHandler)
  fail.graphite.seq.push(notifyHandler)
  //eslint-disable-next-line no-unused-vars
  let thunk: Function = handler ?? defaultThunk.bind(instance)

  instance.done = done
  instance.fail = fail
  ;(instance: any).use = fn => {
    thunk = fn
    return instance
  }
  const getCurrent = (): any => thunk
  ;(instance: any).use.getCurrent = getCurrent
  ;(instance: any).kind = Kind.effect
  //assume that fresh event has empty scope
  ;(instance: any).graphite.scope = {done, fail, getHandler: getCurrent}
  instance.graphite.seq.push(
    step.compute({
      fn(params, scope) {
        if (typeof params === 'object' && params !== null) {
          if ('ɔ' in params) return params.ɔ
        }
        return {
          params,
          req: {
            rs(data) {},
            rj(data) {},
          },
        }
      },
    }),
    step.run({
      fn({params, req}, {getHandler, done, fail}) {
        runEffect(
          getHandler(),
          params,
          OnResolve.bind({event: done, params, handler: req.rs}),
          OnReject.bind({event: fail, params, handler: req.rj}),
        )
        return params
      },
    }),
  )
  ;(instance: any).create = (params: Payload, fullName, args) => {
    const req = new Def()
    eventCreate({ɔ: {params, req}}, instance.getType(), args)
    return req.req
  }

  return instance
}
function runEffect(handler, params, onResolve, onReject) {
  let failedSync = false
  let syncError
  let rawResult
  try {
    rawResult = handler(params)
  } catch (err) {
    failedSync = true
    syncError = err
  }
  if (failedSync) {
    onReject(syncError)
    return
  }
  if (typeof rawResult === 'object' && rawResult !== null) {
    if (typeof rawResult.then === 'function') {
      rawResult.then(onResolve, onReject)
      return
    }
  }
  onResolve(rawResult)
}
//eslint-disable-next-line no-unused-vars
function defaultThunk(value) {
  warning(false, 'no thunk used in %s', this.getType())
  return Promise.resolve()
}
