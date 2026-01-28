import { Module } from '@nestjs/common';
import { WorkflowController } from './workflows/workflow.controller';
import { WorkflowService } from './workflows/workflow.service';
import { OrderModule } from './order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
})
export class AppModule {}
