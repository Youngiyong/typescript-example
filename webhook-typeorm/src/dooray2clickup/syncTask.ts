import { Handler, Context, Callback } from "aws-lambda";
import { IWebhookFromDooray, getClickupTaskId, requestClickupGetTask, isJson, requestClickupToUpdateCustoFieldTask, requestClickupToDeleteTask, requestClickupToUpdateTask, findListByPriorityrId,  IRequestClickupCreateTask, requestClickupToCreateTask, findListByProjectId, getDoorayDescription, IRequestClickupCreateTaskComment, requestClickupToCreateTaskComment, requestClickupGetTasks, findListByMemberId } from "../models";

export const run: Handler = async (event, context: Context, callback: Callback) => {

	console.log('Function name: ', context.functionName)
	console.log('Remaining time: ', context.getRemainingTimeInMillis())

	context.callbackWaitsForEmptyEventLoop = false;

	// -------------------------------------------------------------------
	console.log("incomming hook from dooray", event.body);

	let doorayWebhook: IWebhookFromDooray = event.body;

	// TaskCreate
	if (doorayWebhook.webhookType=='postCreated'){
		
		//Json Parse Check
		const clickupContent = isJson(doorayWebhook.post.body.content) ? JSON.parse(doorayWebhook.post.body.content) : ""
	
		const postId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		const customFields: any = [ { id : postId, value: doorayWebhook.post.id  } ]

		if(clickupContent){
			doorayWebhook.post.body.content = " "
			await requestClickupToDeleteTask(clickupContent.id)
			console.log("ClickupTask Delete Complete")
		}
		
		const tag = clickupContent.tag ? [ clickupContent.tag ] : []
		const description = getDoorayDescription(doorayWebhook) ? getDoorayDescription(doorayWebhook) : " "
		const member = clickupContent.member ? findListByMemberId(clickupContent.member) : findListByMemberId(doorayWebhook.source.member.id)
		const priority = findListByPriorityrId(doorayWebhook.post.priority) ? findListByPriorityrId(doorayWebhook.post.priority) : "none"
		const listNumber = findListByProjectId(doorayWebhook.project.id);
		let status;

		if(listNumber=="28922731"){
			status = "배포 계획/버저닝"
		} else {
			status = "TO DO"
		}

		let request: IRequestClickupCreateTask =  member ? {
			name: doorayWebhook.post.subject,
			description: description,
			assignees: [ member ],
			tags: tag,
			status: status,
			priority: priority,
			// due_date: doorayWebhook.post.dueDate,
			// due_date_time: doorayWebhook.post.dueDate,
			// time_estimate?: number,
			// start_date?: number,
			// start_date_time?: number,
			// notify_all?: number,
			// parent?: null | number,
			// links_to?: null | number,
			check_required_custom_fields: true,
			custom_fields: customFields
		} : {
			name: doorayWebhook.post.subject,
			description: description,
			tags: tag,
			status: status,
			priority: priority,
			// due_date: doorayWebhook.post.dueDate,
			// due_date_time: doorayWebhook.post.dueDate,
			// time_estimate?: number,
			// start_date?: number,
			// start_date_time?: number,
			// notify_all?: number,
			// parent?: null | number,
			// links_to?: null | number,
			check_required_custom_fields: true,
			custom_fields: customFields
		}

		console.log(request)

		await requestClickupToCreateTask(listNumber, request)
			.then(res => {
				console.log("=================>1", res.data);
			})
			.catch(err => {
				console.log("=================>2", err);
			});
		callback(null);
	}
	
	// TaskCommentCreate
	else if (doorayWebhook.webhookType=='postCommentCreated'){

		// console.log(doorayWebhook.comment.body.content.lastIndexOf('From Dooray'))
		// console.log(doorayWebhook.comment.body.content.lastIndexOf('From Clickup'))
		if(doorayWebhook.comment.body.content.lastIndexOf('From Dooray')==-1 && doorayWebhook.comment.body.content.lastIndexOf('From Clickup')==-1){

			const listNumber = findListByProjectId(doorayWebhook.project.id);
			
			//ClickUp All Task Get
			const clickupTasks = await requestClickupGetTasks(listNumber)
	
			//DooraySubject == ClickUpSubject 비교해서 TaskNumber를 얻어온다.
			const taskNumber = getClickupTaskId(doorayWebhook, clickupTasks)
	
			const comment = doorayWebhook.comment.body.content ? doorayWebhook.comment.body.content : " "
	
			const member = findListByMemberId(doorayWebhook.source.member.id) ? findListByMemberId(doorayWebhook.source.member.id) : "5987495"
		
			let request: IRequestClickupCreateTaskComment = {
				comment_text: comment + "\n" + " From Dooray",
				assignee: member,
				notify_all: true
			}
	
			await requestClickupToCreateTaskComment(taskNumber, request)
				.then(res => {
					console.log("=================>1", res.data);
				})
				.catch(err => {
					console.log("=================>2", err);
				});
			callback(null);
		} else {
			console.log("This Comment is exist")
		}
	}


	
};