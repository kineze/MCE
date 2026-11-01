import { describe, expect, it } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { clientIp } from '../server/utils/client-ip'

function eventFrom(headers: Record<string, string>) {
  const socket = new Socket()
  Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' })
  const request = new IncomingMessage(socket)
  request.headers = headers
  return createEvent(request, new ServerResponse(request))
}

describe('clientIp', () => {
  it('ignores X-Forwarded-For unless the proxy is trusted', () => {
    const event = eventFrom({ 'x-forwarded-for': '203.0.113.7' })
    expect(clientIp(event, {})).toBe('127.0.0.1')
    expect(clientIp(event, { TRUST_PROXY: 'true' })).toBe('203.0.113.7')
  })

  it('falls back to the socket address when the header is missing', () => {
    expect(clientIp(eventFrom({}), { TRUST_PROXY: 'true' })).toBe('127.0.0.1')
  })
})
