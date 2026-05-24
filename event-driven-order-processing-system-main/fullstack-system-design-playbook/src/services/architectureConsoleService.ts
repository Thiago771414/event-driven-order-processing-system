import { architectureConsoleMock } from '../mocks/architectureConsoleMock';
import { sagaWorkflowMock } from '../mocks/sagaWorkflowMock';
import type { ArchitectureConsoleSnapshot } from '../types/architecture';
import type { SagaWorkflowModel } from '../types/saga';

export const architectureConsoleService = {
  getSnapshot(): ArchitectureConsoleSnapshot {
    return architectureConsoleMock;
  },

  getSagaWorkflow(): SagaWorkflowModel {
    return sagaWorkflowMock;
  },
};
