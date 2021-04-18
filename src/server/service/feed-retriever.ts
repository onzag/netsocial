import { ServiceProvider, ServiceProviderType } from "@onzag/itemize/server/services";

export class FeedRetriever extends ServiceProvider<null> {
  public static getType() {
    return ServiceProviderType.GLOBAL;
  }

  public initialize() {
    this.globalRedisSub.redisClient.on("message", this.onRedisMessage);
    this.globalRedisSub.redisClient.subscribe("UPDATE_ELEMENT");
  }

  public getRunCycleTime() {
    // 5 minutes, runs every 5 minutes
    return 300000;
  }

  public run() {
    console.log("MUST FETCH NEW POSTS FROM EVERY GIVEN USER");
  }

  public onRedisMessage(channel: string, message: string) {
    if (channel === "UPDATE_ELEMENT") {
      console.log("REQUESTED TO UPDATE FOR ", message);
    }
  }
}
