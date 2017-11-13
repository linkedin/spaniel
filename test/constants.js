const constants = {
	time: {
		IMPRESSION_THRESHOLD : 100,
		RAF_THRESHOLD : 16,
		SMALL: 5
	},
	ITEM_TO_OBSERVE: 5,
	MAC_WINDOW_BAR_HEIGHT: 22,
	VIEWPORT: {
		WIDTH: 400,
		HEIGHT: 400
	},
	NIGHTMARE: {
		TIMEOUT: 10,
		OPTIONS: {
			show: false,
			openDevTools: false,
			waitTimeout: 0
		}
	}
};


export default constants;