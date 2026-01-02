import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private rooms = new Set<string>();

  getRooms(): string[] {
    return Array.from(this.rooms);
  }

  addRoom(room: string) {
    this.rooms.add(room);
  }

  removeRoom(room: string) {
    this.rooms.delete(room);
  }

  getHello(): string {
    return 'Hello World!';
  }
}
