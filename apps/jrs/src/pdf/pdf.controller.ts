import { Controller, Get, Param, Res, HttpStatus, Query } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { type Response } from 'express';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('activity/:id')
  async generateActivityStatsPdf(
    @Param('id') activityId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer =
        await this.pdfService.generateActivityStatsPdf(activityId);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=activity-${activityId}-stats.pdf`,
      });
      res.send(pdfBuffer);
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ error: error.message });
    }
  }

  @Get('yearly/:year')
  async generateYearlyStatsPdf(
    @Param('year') year: number,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateYearlyStatsPdf(year);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=yearly-${year}-stats.pdf`,
      });
      res.send(pdfBuffer);
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ error: error.message });
    }
  }

  @Get('member/:id')
  async generateMemberStatsPdf(
    @Param('id') memberId: string,
    @Query('year') year: number,
    @Query('month') month: number,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateMemberStatsPdf(
        memberId,
        year,
        month,
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=member-${memberId}-stats-${year}-${month}.pdf`,
      });
      res.send(pdfBuffer);
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ error: error.message });
    }
  }
}
