import { useEffect, useState } from 'react'
import { getState, subscribe } from './cinemaStore'

/** Tiny React binding over the cinema store. */
export function useCinemaState(selector = (s) => s) {
  const [slice, setSlice] = useState(() => selector(getState()))
  useEffect(() => subscribe((s) => setSlice(selector(s))), []) // eslint-disable-line
  return slice
}
