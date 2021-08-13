import { Handler, Context, Callback } from "aws-lambda";
import { findListByProjectId, findListByTagId, IWebhookFromClickup, requestDoorayToCreateTask, requestClickupGetTask, requestClickupUpdateWebHook, requestDoorayGetTag, findListByMemberId } from "./model";

export const run: Handler = async (event, context: Context, callback: Callback) => {

	console.log('Function name: ', context.functionName)
	console.log('Remaining time: ', context.getRemainingTimeInMillis())

	context.callbackWaitsForEmptyEventLoop = false;

	// -------------------------------------------------------------------

	console.log("incomming hook", event.body);

	let clickupWebhook: IWebhookFromClickup = JSON.parse(event.body);
	
	//taskCreated
	let clickupEvent = clickupWebhook.event

	// if(clickupEvent=="taskCreated"){
	// 	let taskData = await requestClickupGetTask(clickupEvent.task_id)
	// }
	
	let task = await requestClickupGetTask('test')

	// console.log("=================>1")
	// console.log(taskData.data.assignees)
	// //
	// console.log("=================>2")
	// console.log(taskData.data.watchers)
	// console.log("+==================3")
	// console.log(taskData.data.custom_fields)
	// console.log(taskData.data.custom_fields[0].type_config.options)

	//  assignees = [ { id: 7823814, username: '윤기용' , .....} ]
	let taskAssignees = task.data.assignees[0].id

	//type_config.options = [ { id: 'b9400e46-3ea8-404c-a83c-a611378d831d', name: '프론트-AOS'}, ......]
	const deployTargetNumber = task.data.custom_fields[0].value
	const deployTarget = task.data.custom_fields[0].type_config.options[deployTargetNumber]

	// status: {	id: 'sc28922731_wkZIJ84V', status: '배포 계획/버저닝',
	// const taskStatus = [ task.data.status.id, task.data.status.status ]
	
	const listNumber = task.data.list.id

	const projectId = findListByProjectId(listNumber)

	// console.log(deployTarget)
	// console.log(taskStatus)
	// console.log(listNumber)
	// console.log(projectId)
	// console.log(task)

	const assignees = findListByMemberId(taskAssignees.toString())
	//ClickUp Task Assign is True Assign Add
	let request: IRequestDoorayCreateTask = assignees ? {
		parentPostId: "1", 
		users: {
			to: [{                                    /* 업무 담당자 목록 */
				type: "member",
				member: {
					organizationMemberId: assignees
				}
			}],
			// cc: [{                                    /* 업무 참조자 목록 */
			// 	type: "member",
			// 	member: {
			// 		organizationMemberId: "2393504394989379018"
			// 	}
			// }]
		},
		subject: task.data.name,
		body: {
			mimeType: "text/html",                    /* text/html text/x-markdown */
			content: ""             /* 업무 본문 */
		},
		dueDateFlag: true,
		milestoneId: "1",
		priority: "none",
		tagIds: []
	}  : {
		parentPostId: "1", 
		subject: task.data.name,
		body: {
			mimeType: "text/html",                    /* text/html text/x-markdown */
			content: ""             /* 업무 본문 */
		},
		dueDateFlag: true,
		milestoneId: "1",
		priority: "none",
		tagIds: []
	}


	if(deployTarget){
		let tagId = findListByTagId(deployTarget.id)
		request.tagIds = tagId ? [ tagId ] : []
	}

	await requestDoorayToCreateTask(projectId, request)



};