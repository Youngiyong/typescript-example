import { Handler, Context, Callback } from "aws-lambda";
import { findListByProjectId, findListByTagId, isJson, requestDoorayGetMember, requestDoorayToCreateTaskComment, requestClickupListMember, IWebhookFromClickup, IRequestDoorayCreateTask, getDoorayPostId, requestDoorayToUpdateTask, requestDoorayToCreateTask, requestClickupGetTask, findListByMemberId, requestDoorayGetTask, getClickupComment } from "../models";

export const run: Handler = async (event, context: Context, callback: Callback) => {

	console.log('Function name: ', context.functionName)
	console.log('Remaining time: ', context.getRemainingTimeInMillis())

	context.callbackWaitsForEmptyEventLoop = false;

	// -------------------------------------------------------------------
	console.log("incomming hook from clickup", event.body);
	
	let clickupWebhook: IWebhookFromClickup = event.body;

	//ClickUp WebHook Dooray taskCreated
	if(clickupWebhook.event=="taskCreated"){
		const task = await requestClickupGetTask(clickupWebhook.task_id)
		
		const customFields = task.data.custom_fields
		// console.log(customFields)
		const customId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		let postNumber;

		// f7242db7-4ff4-4400-85d8-14b21dd03890
		for(var i=0; i<customFields.length; i++){
			if(customFields[i].id==customId)
				postNumber = customFields[i].value
		}
		const listNumber = task.data.list.id
		const projectId = findListByProjectId(listNumber)
	
		if(postNumber){
			const doorayTask = await requestDoorayGetTask(projectId, postNumber)
			if(doorayTask){
				console.log("Dooray Task Alreaday Exist")
			}
		}

		else{
			//  assignees = [ { id: 7823814, username: '윤기용' , .....} ]
			// let taskAssignees = ""
			// if (task.data.assignees.length>0){
			// 	taskAssignees = task.data.assignees[0].id
			// }

			//type_config.options = [ { id: 'b9400e46-3ea8-404c-a83c-a611378d831d', name: '프론트-AOS'}, ......]
			// console.log("deployTarget", task.data.custom_fields[0])
			const deployTargetNumber = task.data.custom_fields[0].value
			console.log(task.data.custom_fields)
			const deployTarget = task.data.custom_fields[0].type_config.options[deployTargetNumber]
			//ClickUp Task Assign is True Assign Add
			// const assignees = findListByMemberId(taskAssignees.toString())

			const listNumber = task.data.list.id
			const projectId = findListByProjectId(listNumber)
			console.log(clickupWebhook.history_items[0])
	
			const userId = clickupWebhook.history_items[0].user.id
			const taskCreator = findListByMemberId(userId) ? findListByMemberId(userId) : ""
			const content = { id : clickupWebhook.task_id, member : taskCreator, tag: findListByTagId(deployTarget.id) }
			const json = JSON.stringify(content)
			console.log(json)
			//Dooray Request 
			let request: IRequestDoorayCreateTask = taskCreator ? {
				parentPostId: "1", 
				users: {
					to: [{                                    /* 업무 담당자 목록 */
						type: "member",
						member: {
							organizationMemberId: taskCreator
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
					content: json          /* 업무 본문 */
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
					content: json            /* 업무 본문 */
				},
				dueDateFlag: true,
				milestoneId: "1",
				priority: "none",
				tagIds: []
			}
		

			// if(deployTarget){
			// 	let tagId = findListByTagId(deployTarget.id)
			// 	request.tagIds = tagId ? [ tagId ] : []
			// }

			await requestDoorayToCreateTask(projectId, request)
				.then(res => {
					console.log("=================>1", res.data);
				}).catch(err => {
					console.log("=================>2", err);
				});
			callback(null);
		}
	}

	// Clickup WebHook Dooray task Comment Create
	if(clickupWebhook.event=="taskCommentPosted"){

		let clickupTask = await requestClickupGetTask(clickupWebhook.task_id)
		const listNumber = clickupTask.data.list.id
		const projectId = findListByProjectId(listNumber)

		let customFieldId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		const postId = getDoorayPostId(clickupTask, customFieldId)

		const doorayTask = await requestDoorayGetTask(projectId, postId)

		const comment = await getClickupComment(clickupWebhook);

		console.log(clickupWebhook.history_items[0].comment.comment)
		//attach 확인
		if(doorayTask){
			let request: IRequestDoorayCreateTask = {
				body: {
					mimeType: "text/x-markdown",                    			/* text/html text/x-markdown */
					content: comment            /* 업무 본문 */
					}
				}

			await requestDoorayToCreateTaskComment(projectId, postId, request)
				.then(res => {
					console.log("=================>1", res.data);
				})
				.catch(err => {
					console.log("=================>2", err);
				});
				
		} else {
			console.log("Dooray Task Does not Exist")
		}
	}


	// ClickUp WebHook Dooray task Content Update
	// if(clickupWebhook.event="taskUpdated"){

	// 	let clickupTask = await requestClickupGetTask(clickupWebhook.task_id)

	// 	const listNumber = clickupTask.data.list.id
	// 	const projectId = findListByProjectId(listNumber)

	// 	let customFieldId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
	// 	const postId = getDoorayPostId(clickupTask, customFieldId)

	// 	const doorayTask = await requestDoorayGetTask(projectId, postId)
	// 	console.log(doorayTask)
	// 	console.log(clickupWebhook.history_items[0])
	// 	console.log(clickupWebhook.history_items[0].before)
	// 	console.log(clickupWebhook.history_items[0].comment)
	// 	// if(doorayTask){
	// 	// 	console.log(clickupWebhook.history_items[0])
	// 	// 	console.log(clickupWebhook.history_items[0].before)
	// 	// 	console.log(clickupWebhook.history_items[0].comment)
	// 	// }
	// 	// if(doorayTask){
	// 	// 	parse = JSON.parse(clickupWebhook.history_items[0].before)
	// 	// 	if(parse){
	// 	// 		let request: IRequestDoorayCreateTask = {
	// 	// 		body: {
	// 	// 			mimeType: "text/html",                    /* text/html text/x-markdown */
	// 	// 			content: clickupTask.data.text_content             /* 업무 본문 */
	// 	// 			}
	// 	// 		}
	// 	// 		await requestDoorayToUpdateTask(projectId, postId, request)
	// 	// 		.then(res => {
	// 	// 			console.log("=================>1", res.data);
	// 	// 		})
	// 	// 		.catch(err => {
	// 	// 			console.log("=================>2", err);
	// 	// 		});
	// 	// 	callback(null);
			
	// 	// 	} else {
	// 	// 		console.log("Parse Error Clickup Task Content is not Update")
	// 	// 	}
	// 	// }else
	// 	// 	console.log("Dooray Task Does not Exist")

	// }





};