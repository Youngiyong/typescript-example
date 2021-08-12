import axios, { AxiosInstance, AxiosResponse } from 'axios';


export type WebhookFromCSlack = {
	text: string,
	blocks?: [],
	attashments?: [],
	thread_ts?: string,
	mrkdwn?: boolean,
}

export const requestClickupToCreateTask = async (listNumber: string, param: any) => {
	const url = `https://app.clickup.com/api/v2/list/${listNumber}/task`;
	return await axios.post(url, param, {
		headers: {
			"Authorization": process.env.CLICKUP_API_KEY,
			"Content-Type": "application/json"
		},
	}).catch((err)=>{
		console.log(err)
	});
}

export const requestClickupGetTask = async(taskNumber: string) => {
	const url = `https://api.clickup.com/api/v2/task/${taskNumber}`
	return await axios.get(url, {
		headers: {
			"Authorization": process.env.CLICKUP_API_KEY,
			"Content-Type": "application/json"
		}
	});
}