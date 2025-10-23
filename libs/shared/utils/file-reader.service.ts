import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';

/**
 * File Reader Service - Abstraction for File System Operations
 *
 * This service provides an abstraction layer for file system operations,
 * making it easier to mock in unit tests and following Dependency Inversion Principle.
 *
 * Benefits:
 * - Easy to mock in unit tests
 * - Single Responsibility: Only handles file reading
 * - Follows SOLID principles (Dependency Inversion)
 * - Can be easily replaced with different implementations (e.g., cloud storage)
 *
 * @example
 * // In service constructor
 * constructor(private readonly fileReader: FileReaderService) {}
 *
 * // Usage
 * const content = await this.fileReader.readFile('./config.json');
 */
@Injectable()
export class FileReaderService {
  /**
   * Read file content as UTF-8 string
   *
   * @param path Absolute or relative path to the file
   * @returns File content as string
   * @throws Error if file cannot be read
   *
   * @example
   * const publicKey = await fileReader.readFile('./keys/public-key.pem');
   */
  async readFile(path: string): Promise<string> {
    try {
      return await fs.readFile(path, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to read file at ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if file exists
   *
   * @param path Path to check
   * @returns True if file exists, false otherwise
   *
   * @example
   * const exists = await fileReader.fileExists('./keys/private-key.pem');
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
