import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out='D:/myspace/yang-docs/outputs/01a1a044-945b-7450-a2da-5a89f892abfb';
const support='D:/myspace/yang-docs/.java-learning/artifacts/march-2027';
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create();
const plan=wb.worksheets.add('学习总表');
const daily=wb.worksheets.add('每日打卡');
const ability=wb.worksheets.add('能力验收');
const navy='#243B53', ink='#243746', muted='#627D98', amber='#FFF4D6';
const date=s=>new Date(`${s}T00:00:00Z`);
const iso=d=>d.toISOString().slice(0,10);
const add=(d,n)=>new Date(d.getTime()+n*86400000);
function cell(s,a,v){s.getRange(a).values=[[v]];}
function formula(s,a,f){s.getRange(a).formulas=[[f]];}
function setup(s,cols,rows,widths,title,sub){
 s.showGridLines=false;
 s.getRangeByIndexes(0,0,rows,cols).format={font:{name:'Arial',size:11,color:ink},rowHeight:24,verticalAlignment:'center'};
 widths.forEach((w,i)=>s.getRangeByIndexes(0,i,rows,1).format.columnWidth=w);
 cell(s,'A2',title);s.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:navy};
 s.getRangeByIndexes(2,0,1,cols).format.borders={bottom:{style:'thin',color:'#BCCCDC'}};
 cell(s,'A4',sub);s.getRange('A4').format.font={color:muted,italic:true};
}
function header(s,row,labels){
 s.getRangeByIndexes(row-1,0,1,labels.length).values=[labels];
 s.getRangeByIndexes(row-1,0,1,labels.length).format={fill:navy,font:{bold:true,color:'#FFFFFF'},rowHeight:30,horizontalAlignment:'center'};
}
function stripe(s,start,end,n){for(let r=start;r<=end;r++)if(r%2===0)s.getRangeByIndexes(r-1,0,1,n).format.fill='#F0F4F8';}
function status(s,r){
 s.getRange(r).dataValidation={rule:{type:'list',values:['未开始','进行中','待验证','已完成','已跑通（用户反馈）','休息']}};
 s.getRange(r).conditionalFormats.add('containsText',{text:'已完成',format:{fill:'#E3F3ED',font:{color:'#176B50'}}});
 s.getRange(r).conditionalFormats.add('containsText',{text:'进行中',format:{fill:'#E8EFF9',font:{color:'#234D80'}}});
 s.getRange(r).conditionalFormats.add('containsText',{text:'待验证',format:{fill:'#FFF0CE',font:{color:'#885D11'}}});
}

// Weekly scope is a planning estimate. Original course day numbers remain source indexes.
const weeks=[
 ['2026-11-05','2026-11-08','Redis 接续','P45 逻辑过期：读取、时间判断、异步重建','读四服务职责；画第一页架构草图','预热后等待过期；旧值可读，后台更新；解释争锁','Day29 / P45'],
 ['2026-11-09','2026-11-15','Redis 与登录','P46–51：缓存封装、ID、登录前置、基础下单','物模型模板分页：入口、参数、DTO','独立调用缓存工具；登录到下单可演示；订单与库存对应','Day29 / P46–51'],
 ['2026-11-16','2026-11-22','并发与锁','P52–60 附近：超卖、重复购买、分布式锁；补原子释放','分页用例、QueryPort、远程适配器','复现并解释一次竞争；验证条件更新与锁所有权边界','Day30 / P52–60；安全释放补充范围待核'],
 ['2026-11-23','2026-11-29','Java、SQL、测试','事务、索引与 EXPLAIN、MP 分页、JUnit；独立小接口','Hub 仓储与 SQL 定位，梳理批量聚合','一个分页/事务接口及前端联调；正常和失败路径有验证','Day1–19 按缺口；Day20–24 核心按需'],
 ['2026-11-30','2026-12-06','Cloud 必要基础','HTTP 服务调用、配置、注册、网关；补必需工程约定','完成分页链路图及错误返回说明','能定位跨服务请求与错误；不要求先学完整 Cloud 课程','Day36–39 / P1–73 按依赖选学'],
 ['2026-12-07','2026-12-13','MQ 必要基础','选 Kafka 或 RocketMQ 一种；生产消费、重试、幂等','分页链路闭卷复述；推演新增筛选条件','重复消费实验；说明失败和幂等策略；锁定主项目依赖','Day40–43 / MQ 二选一'],
 ['2026-12-14','2026-12-20','天机学堂起步','P1–18：环境、现有接口、需求与问题定位','选择第二条链路：创建/发布，以源码为准','本地可重复启动；至少一条页面到后端接口可运行','Day47–48 / P1–18'],
 ['2026-12-21','2026-12-27','天机业务基础','P19–37：对象、表、API、学习记录与计划；补 MP','第二条链路：校验、业务规则与状态','学习记录或计划完整链路；说清 DTO/VO、事务边界','Day49–50 / P19–37'],
 ['2026-12-28','2027-01-03','天机并发任务','P38–47：并发、缓存、延迟任务；补线程池核心','第二条链路：调用与持久化，推演失败','能复现并解释任务触发、更新及异常分支','Day51 / P38–47'],
 ['2027-01-04','2027-01-10','天机异步与问答','P48–57：异步持久化、问答链路','第二条链路图；对照主项目事务设计','异步处理结果可观察；问答正常与非法输入可验收','Day52 / P48–57'],
 ['2027-01-11','2027-01-17','天机问答模块','P58–76：问答推进；以实际选集内容核对','IAM/网关中选权限或上下文第三条候选','问答端到端操作；能从请求定位关键类与数据','Day53–54 / P58–76'],
 ['2027-01-18','2027-01-24','天机计划段收口','P77–94：点赞、签到/积分；核对实际选集','第三条候选：上下文传播、隔离和异常','至少一个点赞/签到流程运行；列明已做与未做范围','Day55–56 / P77–94'],
 ['2027-01-25','2027-01-31','独立全栈扩展','先写需求，再自己实现一个小功能；沿用熟悉前端框架','第三条链路闭卷复述；推演变更影响','自定功能有表/API/页面/校验/测试；1月底完整演示','自主实践；不是课程完成数量'],
 ['2027-02-01','2027-02-07','质量与部署','补服务端权限、错误处理、配置、启动说明和测试','整理2–3条链路的关键类索引','按 README 可重启演示；权限拒绝、回滚等路径可验证','Day44–46 工具按需'],
 ['2027-02-08','2027-02-14','排错与性能','选一条真实慢查询或缓存/并发问题；测量并修复','整理设计取舍和未知项，避免猜测运行结论','保存问题、测量、改动与复测；2月中旬脱稿讲解','MySQL/JUC 核心按需；节假日自行调整'],
 ['2027-02-15','2027-02-21','面试补缺','Java/SQL/项目/前端案例模拟面试；定点补缺','练习3–5分钟项目讲解与追问','两轮模拟；能写事务/分页基础代码；前端案例有细节','不再新增完整专题'],
 ['2027-02-22','2027-02-28','投递准备收口','简历、目标岗位清单、演示脚本、项目材料定稿','定稿链路图和问答；保留静态分析标记','2月28日前演示稳定、材料齐备；正式投递3月启动','准备截止 2027-02-28'],
 ['2027-03-01','2027-03-07','启动投递','按岗位匹配定向投递；安排面试；每天复盘','按面试追问定点复习，主项目保持可运行','记录岗位、反馈、薄弱点和下一步；数量按实际调整','2027年3月开始正式投递'],
 ['2027-03-08','2027-03-14','投递与反馈','持续投递；按反馈修简历、讲解与代码','复查被追问的实现，不扩展全量代码阅读','区分定位、前端、后端、项目与编码问题','面试反馈优先'],
 ['2027-03-15','2027-03-21','面试与修补','面试、现场编码、主项目缺陷修复','按需讲解既有链路','每周复盘一次；每个问题形成具体改动或解释','求职与维护并行'],
 ['2027-03-22','2027-03-28','持续求职','按实际反馈调整岗位清单与面试准备','定点复习','跟踪有效反馈；保持演示与讲解一致','不以学完所有课程为投递前置'],
 ['2027-03-29','2027-03-31','月末复盘','归纳投递与面试反馈，制定4月动作','按需整理','区分已改善问题和待补能力；下一周期有优先级','3月为启动月，不预设入职日'],
].map((v,i)=>({id:`W${String(i+1).padStart(2,'0')}`,start:date(v[0]),end:date(v[1]),stage:v[2],main:v[3],iot:v[4],deliver:v[5],ref:v[6]}));

setup(plan,11,43,[10,13,13,18,43,34,48,12,12,13,13],'Java 全栈学习与求职计划','计划日期：2026-11-05 至 2027-03-31。3月开始投递；主准备期截至2月28日。');
plan.tabColor=navy;
cell(plan,'A6','学习定位');cell(plan,'D6','9年前端经验，目标全栈岗位');
cell(plan,'A7','项目分工');cell(plan,'D7','天机学堂实做；IoT 源码带读');
cell(plan,'A8','当前接续');cell(plan,'D8','Redis P45：预热成功，读取/过期判断待验证');
cell(plan,'A9','时间预算');cell(plan,'D9','工作日6小时，周六3小时，周日休息；均可在日历调整');
cell(plan,'A10','IoT 节奏');cell(plan,'D10','周二、周四各约1小时，计入当天预算；不安排公司环境打通');
cell(plan,'A11','打卡方式');cell(plan,'D11','每日填实际小时、状态和证据；完成表示当天计划范围通过验收');
cell(plan,'A12','调整规则');cell(plan,'D12','每周六复盘。落后先缩选修与功能范围，保留运行验收和3月投递目标');
cell(plan,'A14','计划小时');cell(plan,'D14','已记录小时');cell(plan,'G14','已完成学习日');cell(plan,'J14','日计划完成率');
formula(plan,'B14',"=SUM('每日打卡'!F7:F153)");
formula(plan,'E14',"=IF(COUNT('每日打卡'!G7:G153)=0,\"\",SUM('每日打卡'!G7:G153))");
formula(plan,'H14',"=COUNTIFS('每日打卡'!H7:H153,\"已完成\",'每日打卡'!F7:F153,\">0\")");
formula(plan,'K14',"=H14/COUNTIFS('每日打卡'!F7:F153,\">0\")");plan.getRange('K14').setNumberFormat('0%');
plan.getRange('A14:K14').format.rowHeight=30;
header(plan,17,['周次','开始日期','结束日期','阶段','实做与学习主线','IoT 源码带读','本周验收结果','计划小时','实际小时','完成学习日','完成率']);
const planRows=weeks.map(w=>[w.id,w.start,w.end,w.stage,w.main,w.iot,w.deliver,null,null,null,null]);
plan.getRange('A18:K39').values=planRows;stripe(plan,18,39,11);
plan.getRange('B18:C39').setNumberFormat('yyyy-mm-dd');
plan.getRange('D18:G39').format.wrapText=true;
plan.getRange('A18:K39').format.rowHeight=64;
plan.getRange('H18:J39').setNumberFormat('0.0');plan.getRange('J18:J39').setNumberFormat('0');plan.getRange('K18:K39').setNumberFormat('0%');
weeks.forEach((w,i)=>{const r=18+i;
 formula(plan,`H${r}`,`=SUMIFS('每日打卡'!$F$7:$F$153,'每日打卡'!$C$7:$C$153,A${r})`);
 formula(plan,`I${r}`,`=IF(COUNTIFS('每日打卡'!$C$7:$C$153,A${r},'每日打卡'!$G$7:$G$153,\"<>\")=0,\"\",SUMIFS('每日打卡'!$G$7:$G$153,'每日打卡'!$C$7:$C$153,A${r}))`);
 formula(plan,`J${r}`,`=COUNTIFS('每日打卡'!$C$7:$C$153,A${r},'每日打卡'!$H$7:$H$153,\"已完成\",'每日打卡'!$F$7:$F$153,\">0\")`);
 formula(plan,`K${r}`,`=IF(COUNTIFS('每日打卡'!$C$7:$C$153,A${r},'每日打卡'!$F$7:$F$153,\">0\")=0,\"\",J${r}/COUNTIFS('每日打卡'!$C$7:$C$153,A${r},'每日打卡'!$F$7:$F$153,\">0\"))`);
});
cell(plan,'A41','范围说明');cell(plan,'D41','天机学堂先按原路线 P1–94 实做；周目标是预算，按实际选集和验收调整。');
cell(plan,'A42','课程状态');cell(plan,'D42','原 Day 编号只作索引；MySQL 进阶、JUC 完整专题仍按需，MP 延至项目补齐。');
cell(plan,'A43','阅读边界');cell(plan,'D43','IoT 形成调用链图、关键类索引、异常与变更推演；尚未运行的行为标为待验证。');
plan.freezePanes.freezeRows(17);plan.freezePanes.freezeColumns(3);
plan.tables.add('A17:K39',true,'WeeklyPlan').showFilterButton=true;

setup(daily,10,153,[15,8,9,18,64,12,12,16,46,38],'每日打卡','浅黄色为可填写区。日期与周次已排好；计划小时可改，实际小时未填写时留空。');
header(daily,6,['日期','星期','周次','当日安排','当天计划','计划小时','实际小时','状态','完成证据 / 卡点','次日调整']);
const roles={1:'需求与原理',2:'编码与联调',3:'独立实现',4:'验证与排错',5:'模块收口',6:'复盘与补欠',0:'休息'};
const rows=[];
for(let d=date('2026-11-05');d<=date('2027-03-31');d=add(d,1)){
 const w=weeks.find(w=>d>=w.start&&d<=w.end),day=d.getUTCDay(),h=day===0?0:day===6?3:6;
 let task=day===0?'休息；需要调休时修改当天计划和小时':day===6?'对照本周验收复盘；补一个阻塞问题；调整下周范围':`${w.stage}：${roles[day]}。具体范围见学习总表 ${w.id}`;
 if(day===2||day===4)task+=w.id<'W18'?'；其中1小时 IoT 源码带读':'；按面试追问定点补缺';
 rows.push([new Date(d),'日一二三四五六'[day],w.id,roles[day],task,h,null,day===0?'休息':'未开始',null,null]);
}
if(rows.length!==147)throw Error('Unexpected calendar length');
daily.getRange('A7:J153').values=rows;stripe(daily,7,153,10);
daily.getRange('A7:A153').setNumberFormat('yyyy-mm-dd');
daily.getRange('F7:G153').setNumberFormat('0.0');
daily.getRange('D7:E153').format.wrapText=true;daily.getRange('I7:J153').format.wrapText=true;
daily.getRange('A7:J153').format.rowHeight=54;
daily.getRange('E7:J153').format.fill=amber;
daily.getRange('F7:G153').dataValidation={rule:{type:'decimal',operator:'between',formula1:0,formula2:16}};
status(daily,'H7:H153');
daily.freezePanes.freezeRows(6);daily.freezePanes.freezeColumns(3);
daily.tables.add('A6:J153',true,'DailyLog').showFilterButton=true;

const skills=[
 ['基础','Redis NX 与 EX','已跑通（用户反馈）','首次 OK、再次 nil、原值不变、TTL 正数','用户截图及既有带教记录','P44'],
 ['基础','P44 互斥缓存实验','已跑通（用户反馈）','并发冷缓存回源受控；解释得锁后复查','用户反馈跑过且符合预期；独立掌握未验收','P44'],
 ['基础','P45 预热测试','已跑通（用户反馈）','包装 data 与 expireTime；测试类位于 src/test','用户反馈测试成功；GET/TTL 原始结果未另提供','P45'],
 ['基础','P45 读取与过期判断','待验证','先预热2秒，立即与2.5秒后读取；数据仍可读','当前接续点，等待实际运行反馈','P45'],
 ['基础','P45 异步重建','未开始','过期返回旧值；争锁后后台更新；异常最终释放锁','','P45'],
 ['基础','缓存工具封装','未开始','解释泛型、Class、Function；自己增加一次调用','','P46–47'],
 ['基础','全局 ID 与基础下单','未开始','解释位结构；登录用户、库存与订单对应','','P48–51'],
 ['基础','锁、超卖和重复购买','未开始','说明租期/所有权/原子释放；复现并修复一次竞争','','P52–60及必要补充'],
 ['基础','Java 与 Spring 工程约定','未开始','能定位 Bean、接口实现、异常、main/test 和依赖作用域','','原 Day1–11 按缺口'],
 ['基础','SQL、事务、MP 分页','未开始','独立写分页接口；解释事务与索引；EXPLAIN 有实际结果','','MySQL 核心按需；MP Day17–19 延至项目'],
 ['组件','Cloud 最小调用链','未开始','请求跨网关/服务可定位，能解释配置与错误传播','','原 Day36–39 按依赖'],
 ['组件','MQ 与幂等','未开始','一种 MQ 正常消费、重复消费、失败重试可演示','','原 Day40–43 二选一'],
 ['实做','天机环境与接口','未开始','按说明重复启动；页面到 API 可运行','','原 Day47–48 / P1–18'],
 ['实做','天机对象与学习记录','未开始','表、DTO/VO、API、学习记录/计划能对应','','原 Day49–50 / P19–37'],
 ['实做','天机并发与延迟任务','未开始','观察任务触发、结果更新与失败路径','','原 Day51 / P38–47'],
 ['实做','天机异步与问答','未开始','正常与非法输入、异步结果可验证','','原 Day52–54 / P48–76'],
 ['实做','天机点赞与签到','未开始','按实际选集完成计划功能并说明边界','','原 Day55–56 / P77–94'],
 ['实做','独立全栈扩展','未开始','先独立写需求与设计，再实现表/API/页面/校验/测试','','2027年1月底'],
 ['质量','权限与异常','未开始','服务端权限拒绝、非法参数、失败回滚有可观察结果','','2027年2月'],
 ['质量','测试与启动文档','未开始','关键分支测试通过；README 可按步骤启动演示','','JUnit/Mockito/Web层；集成工具按需'],
 ['质量','一次性能或故障排查','未开始','问题、测量、改动、复测对应，记录真实数据','','2027年2月中旬'],
 ['带读','IoT 模板分页链路','未开始','画 DMP 到 Hub/仓储链路；定位校验、聚合和错误','已有部分静态初查，完整链路与讲解未验收','源码只读，不要求启动'],
 ['带读','IoT 第二条业务链','未开始','选择创建/发布等实际存在的链路，解释状态和异常','','源码只读，以代码实际存在为准'],
 ['带读','IoT 权限/异步候选链','未开始','选一条代表链路；解释上下文、边界和未知项','','源码只读，最多2–3条代表链路'],
 ['带读','IoT 讲解与变更推演','未开始','3–5分钟讲解；新增筛选等需求能列改动点；区分推断与运行事实','','不要求公司数据库或内网权限'],
 ['求职','真实前端案例整理','未开始','整理2–3个自己参与的复杂需求、取舍和排错案例','','保留9年前端优势；框架沿用熟悉的一套'],
 ['求职','模拟面试与编码','未开始','至少两轮模拟，记录追问与代码薄弱点','','2027年1–2月'],
 ['求职','简历与演示材料','未开始','项目范围、参与内容、证据和演示一致；目标岗位清单齐备','','截止2027-02-28'],
 ['求职','3月正式投递','未开始','持续记录岗位、面试反馈、问题分类和调整动作','','从2027-03-01开始'],
];
setup(ability,6,58,[12,28,24,70,64,44],'能力验收与课程索引','状态按实际表现更新。看过、跑通、独立完成分别记录；已有成功反馈不等于整段课程掌握。');
header(ability,6,['类别','能力 / 交付','当前状态','通过标准','证据 / 说明','范围 / 原路线索引']);
ability.getRange('A7:F35').values=skills;stripe(ability,7,35,6);
ability.getRange('B7:F35').format.wrapText=true;ability.getRange('A7:F35').format.rowHeight=66;
ability.getRange('C7:C35').format.fill=amber;ability.getRange('E7:E35').format.fill=amber;status(ability,'C7:C35');
ability.tables.add('A6:F35',true,'AcceptanceList').showFilterButton=true;
ability.freezePanes.freezeRows(6);ability.freezePanes.freezeColumns(2);
header(ability,38,['资料','链接 / 来源','状态说明','使用范围','工作量说明','备注']);
const sources=[
 ['用户信息','本聊天，2026-11-05','9年前端、全栈目标、2027年3月投递','天机实做；IoT只读讲解','小时和周排期为建议预算','不从已有源码推定个人交付'],
 ['当前进度','本地带教记录，2026-11-05','P44与P45预热成功为用户反馈','P45读取判断待验证','不重置已有进度','每日打卡只统计本计划，不回填过去小时'],
 ['Redis课程','https://www.bilibili.com/video/BV1cr4y1671t/','当前P45，续至计划P60及必要锁补充','按实际选集核对新增补充内容','视频时长与编码用时分别预算','Redis实例端口6380；工程HTTP8082'],
 ['Spring Cloud','https://www.bilibili.com/video/BV1UJc2ezEFU/','原路线 Day36–39 / P1–73','按天机依赖选学','不要求整段先看完','课程工程保持配套版本'],
 ['Kafka候选','https://www.bilibili.com/video/BV15MJBzcEzd/','与RocketMQ二选一','先按实际项目依赖确定','不同时开两套MQ完整课',''],
 ['RocketMQ候选','https://www.bilibili.com/video/BV1PCsFzHEYa/','与Kafka二选一','生产消费、重试与幂等','只补主项目需要的内容',''],
 ['天机学堂','https://www.bilibili.com/video/BV19RWdzxEF7/','原路线 Day47–56 / P1–94','本次先做P1–94，不等于整课结课','分段标题来自原路线，带学时核对选集','必须有运行验收和自主扩展'],
 ['测试工具','https://www.bilibili.com/video/BV1P14y1k7Hi/','原Mockito资料，按需','JUnit与Spring测试先用起来','不要求测试工具课全部看完','集成工具依验证需要选用'],
 ['原56天路线','java-learning-teacher 原路线快照','Day编号作为资料索引保留','MP延后；MySQL进阶/JUC完整课按需','本表日期为新排期，未把延期标为完成','未重新核验其他聊天的全文'],
];
ability.getRange('A39:F47').values=sources;
ability.getRange('A39:F47').format.wrapText=true;ability.getRange('A39:F47').format.rowHeight=66;
cell(ability,'A50','复盘问题');cell(ability,'B50','本周跑通了什么？');cell(ability,'D50','哪个功能能脱离教程自己写？');
cell(ability,'B51','哪个原理还联系不到代码？');cell(ability,'D51','下周应该缩范围还是补哪项能力？');

// Verify a representative editable status/hour change, including zero vs missing.
cell(daily,'G7',2);cell(daily,'H7','已完成');wb.recalculate();
if(plan.getRange('H14').values[0][0]!==1)throw Error('Completed day summary does not update');
if(plan.getRange('E14').values[0][0]!==2)throw Error('Hours summary does not update');
if(plan.getRange('I18').values[0][0]!==2)throw Error('Weekly hours do not update');
cell(daily,'G7',0);wb.recalculate();
if(plan.getRange('E14').values[0][0]!==0)throw Error('Explicit zero hours lost');
if(plan.getRange('I18').values[0][0]!==0)throw Error('Weekly zero hours lost');
cell(daily,'G7',null);cell(daily,'H7','未开始');wb.recalculate();
if(plan.getRange('E14').values[0][0]!=='')throw Error('Missing hours must remain blank');
if(plan.getRange('I18').values[0][0]!=='')throw Error('Weekly missing hours must remain blank');
const total=rows.reduce((n,r)=>n+r[5],0);
if(plan.getRange('B14').values[0][0]!==total)throw Error('Planned hours do not reconcile');
console.log(JSON.stringify({days:rows.length,weeks:weeks.length,plannedHours:total,prepHours:rows.filter(r=>r[0]<date('2027-03-01')).reduce((n,r)=>n+r[5],0),summary:plan.getRange('H14:K14').values}));
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:20},maxChars:1500})).ndjson);
await fs.writeFile(`${support}/verify.json`,JSON.stringify({total,rows:rows.length,weekly:plan.getRange('H18:K39').values},null,2));
for(const [name,range,file] of [['学习总表','A1:G12','overview'],['学习总表','A17:K21','weekly'],['每日打卡','A1:H12','daily'],['能力验收','A1:F12','acceptance']]){
 const image=await wb.render({sheetName:name,range,scale:1.3,format:'png'});
 await fs.writeFile(`${support}/${file}.png`,new Uint8Array(await image.arrayBuffer()));
}
const xlsx=await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(`${out}/Java全栈学习表_2027年3月投递.xlsx`);
console.log('EXPORTED');
