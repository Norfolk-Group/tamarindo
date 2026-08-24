/**
 * No-op stand-in for the optional `agents` MCP peer. Nico does not
 * attach MCP servers; this exists so wrangler can bundle without
 * installing `@modelcontextprotocol/client`.
 */
export class Client {
  constructor(...args: unknown[]) {
    void args;
  }
}

export class SSEClientTransport {
  constructor(...args: unknown[]) {
    void args;
  }
}

export class StreamableHTTPClientTransport {
  constructor(...args: unknown[]) {
    void args;
  }
}

export class SdkHttpError extends Error {}
