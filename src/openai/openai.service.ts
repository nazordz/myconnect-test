import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    const baseUrl = this.configService.get<string | null>('OPENAI_API_HOST');
    this.client = new OpenAI({
      baseURL: baseUrl,
      apiKey,
    });
  }

  getClient(): OpenAI {
    return this.client;
  }

  async embedText(text: string): Promise<number[]> {
    const client = this.getClient();

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }
}
