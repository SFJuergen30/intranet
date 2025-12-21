import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from '@repo/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('issue')
  @Roles('ADMIN')
  issue(@Request() req, @Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(req.user.id, dto);
  }

  @Post('revoke/:id')
  @Roles('ADMIN')
  revoke(@Request() req, @Param('id') id: string) {
    return this.certificatesService.revoke(id, req.user.id);
  }

  @Get('enrollment/:enrollmentId')
  findByEnrollment(@Request() req, @Param('enrollmentId') enrollmentId: string) {
    return this.certificatesService.findByEnrollment(enrollmentId, req.user.id, req.user.role);
  }
}
