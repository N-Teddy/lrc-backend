import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { UserContextService } from '@app/common/context/user-context.service';

interface EntityWithAudit {
  createdBy?: string;
  updatedBy?: string;
}

function isEntityWithAudit(entity: unknown): entity is EntityWithAudit {
  return typeof entity === 'object' && entity !== null;
}

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userContext: UserContextService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  beforeInsert(event: InsertEvent<EntityWithAudit>) {
    if (isEntityWithAudit(event?.entity)) {
      const userId = this.userContext.getUserId() || 'system';
      if (!event.entity.createdBy) {
        event.entity.createdBy = userId;
      }
      if (!event.entity.updatedBy) {
        event.entity.updatedBy = userId;
      }
    }
  }

  beforeUpdate(event: UpdateEvent<EntityWithAudit>) {
    if (isEntityWithAudit(event?.entity)) {
      const userId = this.userContext.getUserId() || 'system';
      if (!event.entity.updatedBy) {
        event.entity.updatedBy = userId;
      }
    }
  }
}
