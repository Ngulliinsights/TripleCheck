/**
 * Image validation service
 */

import type { ValidationResult } from "./types";

export class ImageValidationService {
  async validateUrl(url: string): Promise<ValidationResult> {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const validation = this.processResponse(response);

      return {
        isValid: validation.errors.length === 0,
        errors: validation.errors,
        warnings: validation.warnings,
        score: this.calculateValidationScore(
          validation.errors.length,
          validation.warnings.length
        ),
      };
    } catch (error) {
      console.error("Image validation failed:", error);
      return this.createErrorResult();
    }
  }

  private processResponse(response: Response): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      errors.push("Invalid image format");
    }

    if (!response.ok) {
      errors.push("Image not accessible");
    }

    this.checkFileSize(response, warnings);

    return { errors, warnings };
  }

  private checkFileSize(response: Response, warnings: string[]): void {
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      warnings.push("Large file size may affect performance");
    }
  }

  private createErrorResult(): ValidationResult {
    return {
      isValid: false,
      errors: ["Failed to validate image"],
      warnings: [],
      score: 0,
    };
  }

  private calculateValidationScore(
    errorCount: number,
    warningCount: number
  ): number {
    if (errorCount > 0) return 0;
    if (warningCount === 0) return 100;
    return 80;
  }
}
