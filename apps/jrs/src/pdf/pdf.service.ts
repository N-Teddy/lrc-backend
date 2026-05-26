import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly templatesDir: string;

  constructor(private statsService: StatsService) {
    this.templatesDir = path.join(process.cwd(), 'apps/jrs/src/pdf/templates');
  }

  private async compileTemplate(
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    return template(data);
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  async generateActivityStatsPdf(activityId: string): Promise<Buffer> {
    // Fetch activity stats
    const jrsCount = await this.statsService.getJrsPerActivity(activityId);
    const gradeBreakdown =
      await this.statsService.getGradePerActivity(activityId);
    const nonJrsCount =
      await this.statsService.getNonJrsPerActivity(activityId);

    // Prepare data for template
    const data = {
      activityId,
      jrsCount,
      nonJrsCount,
      gradeBreakdown,
      generatedAt: new Date().toISOString(),
    };

    const html = await this.compileTemplate('activity-stats', data);
    return this.htmlToPdf(html);
  }

  async generateYearlyStatsPdf(year: number): Promise<Buffer> {
    const yearlyStats = await this.statsService.getYearlyStats(year);

    const data = {
      year,
      yearlyStats,
      generatedAt: new Date().toISOString(),
    };

    const html = await this.compileTemplate('yearly-stats', data);
    return this.htmlToPdf(html);
  }

  async generateMemberStatsPdf(
    memberId: string,
    year: number,
    month: number,
  ): Promise<Buffer> {
    const memberStats = await this.statsService.getStatsByMember(
      memberId,
      year,
      month,
    );

    const data = {
      memberId,
      year,
      month,
      memberStats,
      generatedAt: new Date().toISOString(),
    };

    const html = await this.compileTemplate('member-stats', data);
    return this.htmlToPdf(html);
  }
}
