export interface ActionInterface { id?: string, automationId?: string, actionType?: string, actionData?: string }
export interface AutomationInterface { id?: string, title: string, active: boolean }
export interface ConditionInterface { id?: string, conjunctionId?: string, field?: string, fieldData?: string, operator?: string, value?: string, label?: string }
export interface ConjunctionInterface { id?: string, automationId?: string, parentId?: string, groupType?: string, conjunctions?: ConjunctionInterface[], conditions?: ConditionInterface[] }
export interface TaskInterface {
  id?: string,
  taskNumber?: number,
  taskType?: string,
  dateCreated?: Date,
  dateClosed?: Date,
  associatedWithType?: string,
  associatedWithId?: string,
  associatedWithLabel?: string,
  createdByType?: string,
  createdById?: string,
  createdByLabel?: string,
  assignedToType?: string,
  assignedToId?: string,
  assignedToLabel?: string,
  title?: string,
  status?: string
}
