export interface AnswerInterface { id?: string, value?: string, questionId?: string, formSubmissionId?: string, required?: boolean }
export interface CampusInterface { id?: string, name?: string }
export interface ContactInfoInterface { address1?: string, address2?: string, city?: string, state?: string, zip?: string, homePhone?: string, mobilePhone?: string, workPhone?: string, email?: string, pager?: string, fax?: string, skype?: string, workEmail?: string }
export interface FormInterface { id?: string, name?: string, contentType?: string, restricted?: boolean, accessStartTime?: Date, accessEndTime?: Date, archived: boolean, action?: string }
export interface FormSubmissionInterface { id?: string, formId?: string, contentType?: string, contentId?: string, form?: FormInterface, answers?: AnswerInterface[], questions?: QuestionInterface[] }
export interface GroupInterface { id?: string, name?: string, categoryName?: string, memberCount?: number, trackAttendance?: boolean, parentPickup?: boolean }
export interface GroupMemberInterface { id?: string, personId: string, person?: PersonInterface, groupId: string, group?: GroupInterface }
export interface GroupServiceTimeInterface { id?: string, groupId?: string, serviceTimeId?: string, serviceTime?: ServiceTimeInterface }
export interface HouseholdInterface { id?: string, name?: string }
export interface HouseholdMemberInterface { id?: string, householdId?: string, household?: HouseholdInterface, personId?: string, person?: PersonInterface, role?: string }
export interface NameInterface { first?: string, middle?: string, last?: string, nick?: string, display?: string, title?: string, suffix?: string }
export interface NoteInterface { id?: string, churchId?: string, contentType?: string, contentId?: string, noteType?: string, addedBy?: string, contents?: string, createdAt?: string, updatedAt?: string, person?: PersonInterface }
export interface SearchCondition { field: string, operator: string, value: string }

export interface PersonInterface {
  id?: string,
  name: NameInterface,
  contactInfo: ContactInfoInterface,
  membershipStatus?: string,
  gender?: string,
  birthDate?: Date,
  maritalStatus?: string,
  anniversary?: Date,
  photo?: string,
  photoUpdated?: Date,
  householdId?: string,
  householdRole?: string,
  userId?: string,
  school?: string,
  grade?: string,
  graduationDate?: string,
  employer?: string,
  formSubmissions?: [FormSubmissionInterface]
  child?: boolean,
  inactiveReason?: string,
  inactiveDate?: Date,
  servicesUser?: boolean,
  calendarUser?: boolean,
  checkInsUser?: boolean,
  registrationsUser?: boolean,
  givingUser?: boolean,
  groupsUser?: boolean
}
export interface QuestionInterface { id?: string, formId?: string, title?: string, fieldType?: string, placeholder?: string, description?: string, required?: boolean, choices?: [{ value?: string, text?: string }] }
export interface ServiceInterface { id?: string, campusId?: string, name?: string, campus?: CampusInterface }
export interface ServiceTimeInterface { id?: string, name?: string, longName?: string, serviceId?: string, groups?: GroupInterface[] }
export interface MemberPermissionInterface { id?: string, churchId?: string, memberId?: string, contentType?: string, contentId?: string, action?: string, personName: string, formName?: string }
export interface FormMemberInterface { person?: PersonInterface, access?: string }
export interface FormMemberListInterface { members?: FormMemberInterface[] }
