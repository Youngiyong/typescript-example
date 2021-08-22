import { Handler, Context, Callback } from "aws-lambda";
import { findListByProjectId, findListByTagId, isJson, getAssignees, requestDoorayUpdateWorkId, findListByWorkFlowId, requestDoorayGetMember, requestDoorayToCreateTaskComment, requestClickupListMember, IWebhookFromClickup, IRequestDoorayCreateTask, getDoorayPostId, requestDoorayToUpdateTask, requestDoorayToCreateTask, requestClickupGetTask, findListByMemberId, requestDoorayGetTask, getClickupComment, requestClickupUpdateWebHook, requestClickupGetWebHook } from "../models";

export const run: Handler = async (event, context: Context, callback: Callback) => {

	console.log('Function name: ', context.functionName)
	console.log('Remaining time: ', context.getRemainingTimeInMillis())

	context.callbackWaitsForEmptyEventLoop = false;

	// -------------------------------------------------------------------
	console.log("incomming hook from clickup", event.body);
	
	let clickupWebhook: IWebhookFromClickup = event.body;


	const clickupTask = await requestClickupGetTask(clickupWebhook.task_id)

	const listNumber = clickupTask.data.list.id
	const projectId = findListByProjectId(listNumber)

	const customFieldId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
	const postId = getDoorayPostId(clickupTask, customFieldId)

	//ClickUp WebHook Dooray taskCreated
	if(clickupWebhook.event==="taskCreated"){
	
		if(postId === undefined) {

			const userId = clickupWebhook.history_items[0].user.id
			const taskCreator = findListByMemberId(userId) ? findListByMemberId(userId) : ""
			const content =  JSON.stringify({ id : clickupWebhook.task_id, member : taskCreator })

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
				subject: clickupTask.data.name,
				body: {
					mimeType: "text/html",                    /* text/html text/x-markdown */
					content: content          /* 업무 본문 */
				},
				dueDateFlag: true,
				milestoneId: "1",
				priority: "none",
				tagIds: []
			}  : {
				parentPostId: "1", 
				subject: clickupTask.data.name,
				body: {
					mimeType: "text/html",                    /* text/html text/x-markdown */
					content: content           				 /* 업무 본문 */
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

	//ClickUp WebHook Dooray Task Status Update
	else if(clickupWebhook.event==="taskStatusUpdated"){

		if(clickupWebhook.history_items.length>0){

			//ClickUp workFlowStatus -> DoorayWorkFlowId Get
			const workFlowId = findListByWorkFlowId(clickupWebhook.history_items[0].after.status)
	
			if(projectId!==undefined && postId!==undefined){
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
	}


	// Clickup WebHook Dooray Task Comment Create
	else if(clickupWebhook.event==="taskCommentPosted"){
		const comment = await getClickupComment(clickupWebhook);
		
		if(projectId!==undefined && postId!==undefined){
			if(comment.lastIndexOf('From Dooray')==-1){
				const doorayTask = await requestDoorayGetTask(projectId, postId)
				
				if(doorayTask){

					const AWS = require('aws-sdk')
					const dynamoDb = new AWS.DynamoDB.DocumentClient();

					const userId = {
						TableName: process.env.DYNAMODB_TABLE,
						Key: {
						  id: clickupWebhook.history_items[0].user.id.toString()
						}
					}
			
					let doorayApiKey
					await dynamoDb.get(userId).promise()
					.then(res => {
						doorayApiKey = res.Item.key
						console.log(doorayApiKey)
					})
					.catch(error => {
						console.error(error);
						callback(new Error('Couldn\'t get apiKey.'));
						return;
					});

					let request: IRequestDoorayCreateTask = {
						body: {
							mimeType: "text/x-markdown",                    			/* text/html text/x-markdown */
							content: comment            /* 업무 본문 */
						}
					}
					await requestDoorayToCreateTaskComment(projectId, postId, doorayApiKey, request)
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
	else if (clickupWebhook.event==="taskUpdated"){

		if(projectId!==undefined && postId!==undefined){

			const doorayTask = await requestDoorayGetTask(projectId, postId)

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
	else if(clickupWebhook.event==="taskAssigneeUpdated"){
		const assignees = getAssignees(clickupTask) ? getAssignees(clickupTask) : ""
		
		if(projectId!==undefined && postId!==undefined){
			const doorayTask = await requestDoorayGetTask(projectId, postId)
		
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