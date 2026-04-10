export namespace main {
	
	export class PickPathOptions {
	    defaultPath: string;
	
	    static createFrom(source: any = {}) {
	        return new PickPathOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.defaultPath = source["defaultPath"];
	    }
	}

}

