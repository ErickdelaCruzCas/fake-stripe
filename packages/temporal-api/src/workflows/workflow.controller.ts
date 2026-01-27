import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { StartUserContextWorkflowDto, StartPaymentWorkflowDto } from './dto/start-workflow.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('workflows')
@Controller('api/v1/workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('user-context')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start user context aggregation workflow' })
  @ApiResponse({
    status: 202,
    description: 'Workflow started successfully',
    schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        correlationId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async startUserContextWorkflow(@Body() dto: StartUserContextWorkflowDto) {
    const correlationId = dto.correlationId || uuidv4();
    const strategy = dto.strategy || 'parallel';

    const workflowId = await this.workflowService.startUserContextWorkflow(
      correlationId,
      strategy
    );

    return {
      workflowId,
      correlationId,
      message: 'User context workflow started',
    };
  }

  @Post('payment')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start payment workflow with Saga pattern' })
  @ApiResponse({
    status: 202,
    description: 'Payment workflow started successfully',
    schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        correlationId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async startPaymentWorkflow(@Body() dto: StartPaymentWorkflowDto) {
    const correlationId = dto.correlationId || uuidv4();

    const charge = {
      amount: dto.amount,
      currency: dto.currency,
      source: dto.source,
      description: dto.description,
    };

    const workflowId = await this.workflowService.startPaymentWorkflow(
      charge,
      correlationId
    );

    return {
      workflowId,
      correlationId,
      message: 'Payment workflow started',
    };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get workflow execution status' })
  @ApiResponse({
    status: 200,
    description: 'Workflow status retrieved',
  })
  async getWorkflowStatus(@Param('id') workflowId: string) {
    try {
      return await this.workflowService.getWorkflowStatus(workflowId);
    } catch (error) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get real-time workflow progress' })
  @ApiResponse({
    status: 200,
    description: 'Workflow progress retrieved',
  })
  async getWorkflowProgress(@Param('id') workflowId: string) {
    try {
      return await this.workflowService.getWorkflowProgress(workflowId);
    } catch (error) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get workflow result (waits for completion)' })
  @ApiResponse({
    status: 200,
    description: 'Workflow result retrieved',
  })
  async getWorkflowResult(@Param('id') workflowId: string) {
    try {
      return await this.workflowService.getWorkflowResult(workflowId);
    } catch (error) {
      throw new NotFoundException(
        `Workflow ${workflowId} not found or still running`
      );
    }
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel running workflow' })
  @ApiResponse({
    status: 200,
    description: 'Cancellation signal sent',
  })
  async cancelWorkflow(@Param('id') workflowId: string) {
    try {
      await this.workflowService.cancelWorkflow(workflowId);
      return {
        workflowId,
        message: 'Cancellation signal sent',
      };
    } catch (error) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get workflow execution history' })
  @ApiResponse({
    status: 200,
    description: 'Workflow history retrieved',
  })
  async getWorkflowHistory(@Param('id') workflowId: string) {
    try {
      const history = await this.workflowService.getWorkflowHistory(workflowId);
      return {
        workflowId,
        events: history,
      };
    } catch (error) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }
  }
}
