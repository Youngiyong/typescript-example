import { Handler, Context, Callback } from "aws-lambda";
import { findListByProjectId, findListByTagId, IWebhookFromClickup, IRequestDoorayCreateTask, requestClickupGetTasks, requestDoorayToCreateTask, requestClickupGetTask, findListByMemberId, requestDoorayGetTask } from "../models";

export const run: Handler = async (event, context: Context, callback: Callback) => {

	console.log('Function name: ', context.functionName)
	console.log('Remaining time: ', context.getRemainingTimeInMillis())

	context.callbackWaitsForEmptyEventLoop = false;

	// -------------------------------------------------------------------
	console.log("incomming hook from clickup", event.body);
	
	let clickupWebhook: IWebhookFromClickup = event.body;

	// // f7242db7-4ff4-4400-85d8-14b21dd03890
	// //ClickUp WebHook Dooray taskCreated
	if(clickupWebhook.event=="taskCreated"){
		let task = await requestClickupGetTask(clickupWebhook.task_id)
		
		const customFields = task.data.custom_fields
		const customId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		let postNumber = null

		// f7242db7-4ff4-4400-85d8-14b21dd03890
		for(var i=0; i<customFields.length; i++){
			if(customFields[i].id==customId)
				postNumber = customFields[i].value
		}
		const listNumber = task.data.list.id
		const projectId = findListByProjectId(listNumber)
	
		if(postNumber){
			let doorayTask = await requestDoorayGetTask(projectId, postNumber)
			if(doorayTask){
				console.log("Dooray Task Alreaday Exist")
			}
		}
		else{
			console.log("Dorray Task Create")
			//  assignees = [ { id: 7823814, username: '윤기용' , .....} ]
			let taskAssignees = ""
			if (task.data.assignees.length>0){
				taskAssignees = task.data.assignees[0].id
			}

			//type_config.options = [ { id: 'b9400e46-3ea8-404c-a83c-a611378d831d', name: '프론트-AOS'}, ......]
			const deployTargetNumber = task.data.custom_fields[0].value
			const deployTarget = task.data.custom_fields[0].type_config.options[deployTargetNumber]
	
			const listNumber = task.data.list.id
			const projectId = findListByProjectId(listNumber)

			// console.log(deployTarget)
			// console.log(taskStatus)
			// console.log(listNumber)
			// console.log(projectId)
			// console.log(task)
	
			//ClickUp Task Assign is True Assign Add
			const assignees = findListByMemberId(taskAssignees.toString())

			//Dooray Request 
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
				.then(res => {
					console.log("=================>1", res.data);
				}).catch(err => {
					console.log("=================>2", err);
				});
			callback(null);
		}
	}

};