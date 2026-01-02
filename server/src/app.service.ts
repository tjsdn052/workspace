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

  executeCode(code: string) {
    try {
      const logs: string[] = [];
      
      // 간단한 무한루프 패턴 체크
      if (code.includes('while(true)') || code.includes('for(;;)')) {
        return {
          success: false,
          error: 'Infinite loop detected',
          output: 'Code contains potential infinite loop'
        };
      }
      
      // Capture console.log output
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.map(arg => String(arg)).join(' '));
      };
      
      const result = eval(code);
      
      // Restore original console.log
      console.log = originalLog;
      
      return {
        success: true,
        result: result !== undefined ? String(result) : 'undefined',
        output: logs.length > 0 ? logs.join('\n') : 'Code executed successfully',
        logs: logs
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: 'Execution failed'
      };
    }
  }
}
