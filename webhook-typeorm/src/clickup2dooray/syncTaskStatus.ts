import { Handler, Context, Callback } from "aws-lambda";
import { findListByProjectId, getDoorayPostId, findListByWorkFlowId, requestClickupGetTask, requestDoorayUpdateWorkId, requestDoorayGetTask } from "../models";

export const run: Handler = async (event, context: Context, callback: Callback) => {

	console.log('Function name: ', context.functionName)
	console.log('Remaining time: ', context.getRemainingTimeInMillis())

	context.callbackWaitsForEmptyEventLoop = false;

	// -------------------------------------------------------------------

	const clickupWebhook = event.body

	console.log("incomming hook from clickup", IWebhookData);

	if(clickupWebhook.event=="taskCommentPosted"){
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


};