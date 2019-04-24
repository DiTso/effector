//@flow

import * as React from 'react'
//$todo
import {render, cleanup, act} from 'react-testing-library'
import {createStore, createEvent} from 'effector'
import {useStore} from '../useStore'

afterEach(cleanup)

describe.skip('useStore', () => {
  it('should render', () => {
    const store = createStore('foo')
    const changeText = createEvent('change text')
    store.on(changeText, (_, e) => e)

    const Display = props => {
      const state = useStore(store)
      return <span>Store text: {state}</span>
    }

    const {container} = render(<Display />)
    expect(container.firstChild).toMatchSnapshot()
    act(() => {
      changeText('bar')
    })
    // flushEffects()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should throw', () => {
    const ErrorDisplay = props => {
      //$off
      const state = useStore(undefined)
      return <span>Store text: {state}</span>
    }

    expect(() => {
      render(<ErrorDisplay />)
    }).toThrowErrorMatchingSnapshot()
  })
})
