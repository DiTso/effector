//@flow

import {Kind, type kind} from 'effector/stdlib'

export const unit = (obj: mixed) =>
  (typeof obj === 'function' || (typeof obj === 'object' && obj !== null))
  //$off
  && 'kind' in obj

//$off
const is = (type: kind) => (obj: mixed) => unit(obj) && obj.kind === type

export const store = is(Kind.store)
export const event = is(Kind.event)
export const effect = is(Kind.effect)
