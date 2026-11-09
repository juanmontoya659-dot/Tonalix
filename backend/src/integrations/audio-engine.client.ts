import {
  Injectable,
} from "@nestjs/common";

import {
  HttpService,
} from "@nestjs/axios";

import {
  firstValueFrom,
} from "rxjs";

import * as fs from "fs";

import FormData from "form-data";

@Injectable()
export class AudioEngineClient {
  private readonly baseUrl =
    process.env.AUDIO_ENGINE_URL;

  constructor(
    private readonly httpService:
      HttpService,
  ) {}

  async analyze(
    filePath: string,
    originalName: string,
  ) {
    const formData =
      new FormData();

    formData.append(
      "file",
      fs.createReadStream(
        filePath,
      ),
      {
        filename:
          originalName,
      },
    );

    const response =
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/audio/analyze`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },

            maxBodyLength:
              Infinity,

            maxContentLength:
              Infinity,
          },
        ),
      );

    return response.data;
  }

  async transpose(
    filePath: string,
    originalName: string,
    semitones: number,
  ) {
    const formData =
      new FormData();

    formData.append(
      "file",
      fs.createReadStream(
        filePath,
      ),
      {
        filename:
          originalName,
      },
    );

    formData.append(
      "semitones",
      semitones.toString(),
    );

    const response =
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/audio/transpose`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },

            responseType:
              "arraybuffer",

            maxBodyLength:
              Infinity,

            maxContentLength:
              Infinity,
          },
        ),
      );

    return Buffer.from(
      response.data as ArrayBuffer,
    );
  }
}