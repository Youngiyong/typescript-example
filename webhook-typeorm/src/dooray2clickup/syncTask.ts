import { Handler, Context, Callback } from "aws-lambda";
import { IWebhookFromDooray, getClickupTaskId, requestClickupGetTask, IRequestClickupCreateTask, requestClickupToCreateTask, findListByProjectId, getDoorayDescription, IRequestClickupCreateTaskComment, requestClickupToCreateTaskComment, requestClickupGetTasks } from "../models";

export const run: Handler = async (event, context: Context, callback: Callback) => {

	console.log('Function name: ', context.functionName)
	console.log('Remaining time: ', context.getRemainingTimeInMillis())

	context.callbackWaitsForEmptyEventLoop = false;

	// -------------------------------------------------------------------
	console.log("incomming hook from dooray", event.body);

	//두레이 설정에서 slack format으로 수신하도록 설정
	let doorayWebhook: IWebhookFromDooray = event.body;
	console.log(doorayWebhook)
	// console.log(task.data.custom_fields)
	//https://api.slack.com/reference/messaging/payload

	// TaskCreate
	if (doorayWebhook.webhookType=='postCreated'){

		// ClickUP custom_fields에 Dooray Task ID(post) 저장 
		const postId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		const customFields: any = [ { id : postId, value: doorayWebhook.post.id  } ]
		const description = getDoorayDescription(doorayWebhook) ? getDoorayDescription(doorayWebhook) : " "

		console.log("postCreated description ",description)
		let request: IRequestClickupCreateTask = {
			name: doorayWebhook.post.subject,
			description: description,
			// assignees?: [],
			// tags?: [],
			status: "TO DO",
			priority: "none",
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
	
	
		let listNumber = findListByProjectId(doorayWebhook.project.id);
		await requestClickupToCreateTask(listNumber, request)
			.then(res => {
				console.log("=================>1", res.data);
			})
			.catch(err => {
				console.log("=================>2", err);
			});
		callback(null);
	}
	
	//TaskCommentCreate
	if (doorayWebhook.webhookType=='postCommentCreated'){
	
		const listNumber = findListByProjectId(doorayWebhook.project.id);
		
		// ?custom_fields=[{"field_id":"de761538-8ae0-42e8-91d9-f1a0cdfbd8b5",
		// "operator":">","value":2},{...}]
		// const postId = "f7242db7-4ff4-4400-85d8-14b21dd03890"
		
		// const custom_fields = [{ 
		// 	field_id : postId,
		// 	operator :"IS NOT NULL",
		// 	value : "3074946650035980397"
		// }]

		// const customFields = JSON.stringify(custom_fields)

		//ClickUp All Task Get
		const taskData = await requestClickupGetTasks(listNumber)
	
		const tasks = taskData.data.tasks

		//DooraySubject == ClickUpSubject 비교해서 TaskNumber를 얻어온다.
		const taskNumber = getClickupTaskId(doorayWebhook, tasks)

		const comment = doorayWebhook.comment.body.content ? doorayWebhook.comment.body.content : " "

		console.log("postCommentCreated ",comment)
		let request: IRequestClickupCreateTaskComment = {
			comment_text: comment,
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
	}

};