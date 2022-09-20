import { create } from 'ipfs-core'
import type { IPFS } from 'ipfs-core-types'
import { useEffect, useRef, useState } from 'react'

let ipfs: IPFS | null = null

/*
 * A quick demo using React hooks to create an ipfs instance.
 *
 * Hooks are brand new at the time of writing, and this pattern
 * is intended to show it is possible. I don't know if it is wise.
 *
 * Next steps would be to store the ipfs instance on the context
 * so use-ipfs calls can grab it from there rather than expecting
 * it to be passed in.
 */
export default function useIpfsFactory() {
  const [isIpfsReady, setIpfsReady] = useState<boolean>(Boolean(ipfs))
  const [ipfsInitError, setIpfsInitError] = useState<unknown>(null)
  const guard = useRef<boolean>(false)

  useEffect(() => {
    // The fn to useEffect should not return anything other than a cleanup fn,
    // So it cannot be marked async, which causes it to return a promise,
    // Hence we delegate to a async fn rather than making the param an async fn.

    startIpfs()
    return function cleanup() {
      if (ipfs && ipfs.stop) {
        console.log('Stopping IPFS')
        ipfs
          .stop()
          .then(() => {
            ipfs = null
            setIpfsReady(false)
            guard.current = false
          })
          .catch(err => console.error(err))
      }
    }
  }, [])

  async function startIpfs() {
    if (guard.current) return
    if (ipfs) {
      console.log('IPFS already started')
      // @ts-ignore
    } else if (window.ipfs && window.ipfs.enable) {
      console.log('Found window.ipfs')
      // @ts-ignore
      ipfs = await window.ipfs.enable({ commands: ['id'] })
    } else {
      try {
        guard.current = true
        console.time('IPFS Started')
        ipfs = await create()
        console.timeEnd('IPFS Started')
      } catch (error) {
        console.error('IPFS init error:', error)
        ipfs = null
        guard.current = false
        setIpfsInitError(error)
      }
    }

    setIpfsReady(Boolean(ipfs))
  }

  return { ipfs, isIpfsReady, ipfsInitError }
}
