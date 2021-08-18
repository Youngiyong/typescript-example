import { Handler, Context, Callback } from "aws-lambda";
import { findListByProjectId, findListByTagId, isJson, getAssignees, requestDoorayUpdateWorkId, findListByWorkFlowId, requestDoorayGetMember, requestDoorayToCreateTaskComment, requestClickupListMember, IWebhookFromClickup, IRequestDoorayCreateTask, getDoorayPostId, requestDoorayToUpdateTask, requestDoorayToCreateTask, requestClickupGetTask, findListByMemberId, requestDoorayGetTask, getClickupComment, requestClickupUpdateWebHook, requestClickupGetWebHook } from "../models";

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
		
		if(projectId) {
			if(postNumber){
				const doorayTask = await requestDoorayGetTask(projectId, postNumber)
				if(doorayTask){
					console.log("Dooray Task Alreaday Exist")
				}
			}
	
			else{
				//type_config.options = [ { id: 'b9400e46-3ea8-404c-a83c-a611378d831d', name: '프론트-AOS'}, ......]
				// console.log("deployTarget", task.data.custom_fields[0])
				const deployTargetNumber = task.data.custom_fields[0].value
				const deployTarget = task.data.custom_fields[0].type_config.options[deployTargetNumber]
	
				const listNumber = task.data.list.id
				const projectId = findListByProjectId(listNumber)
				console.log(clickupWebhook.history_items[0])
		
				const userId = clickupWebhook.history_items[0].user.id
				const taskCreator = findListByMemberId(userId) ? findListByMemberId(userId) : ""
				const content =  deployTarget ? { id : clickupWebhook.task_id, member : taskCreator, tag: deployTarget.id } 
											  : { id : clickupWebhook.task_id, member : taskCreator }
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
	
	}

	//ClickUp WebHook Dooray Task Status Update
	else if(clickupWebhook.event=="taskStatusUpdated"){
		if(clickupWebhook.history_items.length>0){
			console.log(clickupWebhook.history_items[0])
			//ClickUp Task Data Get	
			const taskData = await requestClickupGetTask(clickupWebhook.task_id)
		
			let projectId = findListByProjectId(taskData.data.list.id)
			console.log(taskData.data.custom_fields)
			//ClickUp Task Data Custom Field ID -> Post ID Get
			let customFieldId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
			const postId = getDoorayPostId(taskData, customFieldId)
			
			//ClickUp workFlowStatus -> DoorayWorkFlowId Get
			const workFlowId = findListByWorkFlowId(clickupWebhook.history_items[0].after.status)
	
			const doorayTask = await requestDoorayGetTask(projectId, postId)
			
			if(doorayTask){
				//Dooray Post WorkFlowId Update 
				await requestDoorayUpdateWorkId(projectId, postId, workFlowId)
					.then(res => {
						console.log("=================>1", res.data);
					})
					.catch(err => {
							console.log("=================>2", err);
					});
					callback(null);
			}
	
		}
	}


	// Clickup WebHook Dooray Task Comment Create
	else if(clickupWebhook.event=="taskCommentPosted"){

		let clickupTask = await requestClickupGetTask(clickupWebhook.task_id)
		const listNumber = clickupTask.data.list.id
		const projectId = findListByProjectId(listNumber)

		let customFieldId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		const postId = getDoorayPostId(clickupTask, customFieldId)

		const doorayTask = await requestDoorayGetTask(projectId, postId)

		const comment = await getClickupComment(clickupWebhook);

		if(projectId){
			if(comment.lastIndexOf('From Dooray')==-1){
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
			}else{
				console.log("Comment is Exist")
			}
		}

		
	}


	// ClickUp WebHook Dooray Task Content Update
	else if (clickupWebhook.event=="taskUpdated"){

		let clickupTask = await requestClickupGetTask(clickupWebhook.task_id)

		const listNumber = clickupTask.data.list.id
		const projectId = findListByProjectId(listNumber)

		let customFieldId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		const postId = getDoorayPostId(clickupTask, customFieldId)

		const doorayTask = await requestDoorayGetTask(projectId, postId)
		if(projectId){
			if(doorayTask){
				let request: IRequestDoorayCreateTask = {
					subject: clickupTask.data.name,
					body: {
						mimeType: "text/x-markdown",                 /* text/html text/x-markdown */
						content: clickupTask.data.text_content          /* 업무 본문 */
						}
				}
				await requestDoorayToUpdateTask(projectId, postId, request)
					.then(res => {
						console.log("=================>1", res.data);
					})
					.catch(err => {
						console.log("=================>2", err);
					});
				callback(null);
				
				} else {
					console.log("Dooray Task Does not Exist")
				}
		}
	
	}

	// ClickUp WebHook Dooray Task Assignee Update
	else if(clickupWebhook.event=="taskAssigneeUpdated"){

		let clickupTask = await requestClickupGetTask(clickupWebhook.task_id)

		const listNumber = clickupTask.data.list.id
		const projectId = findListByProjectId(listNumber)

		let customFieldId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		const postId = getDoorayPostId(clickupTask, customFieldId)
		const assignees = getAssignees(clickupTask) ? getAssignees(clickupTask) : ""
		const doorayTask = await requestDoorayGetTask(projectId, postId)

		if(projectId){
			if(doorayTask){
				let request: IRequestDoorayCreateTask = assignees ? {
					users: {		
						// to: assignees
						to: assignees
						// type: "giyong@lastorder.co.kr"
					},
					subject: clickupTask.data.name,
					body: {
						mimeType: "text/x-markdown",                 /* text/html text/x-markdown */
						content: clickupTask.data.text_content          /* 업무 본문 */
					}
					
				} : ""
	
				if(request){
					await requestDoorayToUpdateTask(projectId, postId, request)
					.then(res => {
						console.log("=================>1", res.data);
					})
					.catch(err => {
						console.log("=================>2", err);
					});
				callback(null);
				}
				
			} else {
				console.log("Dooray Task Does not Exist")
			}
		}
	

	}

}