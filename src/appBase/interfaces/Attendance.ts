import { CampusInterface, ServiceInterface, ServiceTimeInterface, PersonInterface } from "."

export interface AttendanceInterface { campus: CampusInterface, service: ServiceInterface, serviceTime: ServiceTimeInterface, groupId: string }
export interface AttendanceRecordInterface { serviceTime: ServiceTimeInterface, service: ServiceInterface, campus: CampusInterface, week: number, count: number, visitDate: Date, groupId: string }
export interface VisitInterface { id?: string, personId?: string, serviceId?: string, groupId?: string, visitDate?: Date, visitSessions?: VisitSessionInterface[], person?: PersonInterface }
export interface VisitSessionInterface { id?: string, visitId?: string, sessionId?: string, visit?: VisitInterface, session?: SessionInterface }
export interface SessionInterface { id?: string, groupId: string, serviceTimeId: string, sessionDate?: Date, displayName: string }
export interface SettingInterface { id?: string, keyName?: string, value?: string }
