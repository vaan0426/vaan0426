import {getLanguage} from './i18n.js';
export const t=(bg,en)=>getLanguage()==='en'?en:bg;
export const title=item=>getLanguage()==='en'?(item.titleEn||item.title):item.title;
export const body=item=>getLanguage()==='en'?(item.bodyEn||item.body):item.body;
const statuses={pending:['Чака одобрение','Pending approval'],accepted:['Приета','Accepted'],rejected:['Отхвърлена','Rejected'],moved:['Преместена','Rescheduled'],cancelled:['Анулирана','Cancelled'],paid:['Платено','Paid'],awaiting_payment:['Очаква плащане','Awaiting payment']};
export const status=value=>statuses[value]?t(...statuses[value]):value;
const payments={undecided:['След одобрение','After approval'],choose:['Клиентът избира плащане','Customer chooses payment'],onsite:['На място','On site'],package:['Час от пакет','Package credit'],paid:['Платено','Paid']};
export const payment=value=>payments[value]?t(...payments[value]):value;
