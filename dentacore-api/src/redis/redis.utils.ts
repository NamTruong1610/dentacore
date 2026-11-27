import { Injectable } from "@nestjs/common";

@Injectable()
export class RedisUtils {
  assertExecOk(results: [Error | null, unknown][] | null, context: string) {
    if (!results) throw new Error(`${context}: transaction aborted`);
    for (const result of results) {
      if (result[0]) throw new Error(`${context}: command failed`, { cause: result[0] });
    }
  }
}