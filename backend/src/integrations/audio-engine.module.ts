import {
  Module,
} from "@nestjs/common";

import {
  HttpModule,
} from "@nestjs/axios";

import {
  AudioEngineClient,
} from "./audio-engine.client.js";




@Module({
  imports: [
    HttpModule,
  ],

  providers: [
    AudioEngineClient,
  ],

  exports: [
    AudioEngineClient,
  ],
})
export class AudioEngineModule {}