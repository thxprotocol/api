import { application } from './app';

const server = application.listen(application.get('port'));

export default server;
