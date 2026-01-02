import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { AppService } from './app.service';

@WebSocketGateway({ path: '/signaling' })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly appService: AppService) {}

  // topic -> Set of sockets
  private topics = new Map<string, Set<WebSocket>>();

  handleConnection(client: WebSocket, request: IncomingMessage) {
    console.log(`Client connected`);

    // Setup ping-pong for health check if needed,
    // but y-webrtc handles reconnection naturally.

    client.on('message', (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString());
        this.handleMessage(client, msg);
      } catch (e) {
        console.error('Invalid message:', e);
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    console.log(`Client disconnected`);
    this.topics.forEach((clients, topic) => {
      if (clients.delete(client)) {
        // Optionally notify others of disconnection if the protocol requires it,
        // but y-webrtc relies on WebRTC connection state usually.
      }
      if (clients.size === 0) {
        this.topics.delete(topic);
        this.appService.removeRoom(topic);
      }
    });
  }

  private handleMessage(client: WebSocket, msg: any) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'subscribe':
        (msg.topics || []).forEach((topic: string) => {
          if (!this.topics.has(topic)) {
            this.topics.set(topic, new Set());
            this.appService.addRoom(topic);
          }
          this.topics.get(topic)?.add(client);
        });
        break;

      case 'unsubscribe':
        (msg.topics || []).forEach((topic: string) => {
          const clients = this.topics.get(topic);
          if (clients) {
            clients.delete(client);
          }
        });
        break;

      case 'publish':
        if (msg.topic) {
          const receivers = this.topics.get(msg.topic);
          if (receivers) {
            receivers.forEach((receiver) => {
              if (
                receiver !== client &&
                receiver.readyState === WebSocket.OPEN
              ) {
                receiver.send(JSON.stringify(msg));
              }
            });
          }
        }
        break;

      case 'ping':
        client.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }
}
