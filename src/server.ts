import app from './app';
import { eventIndexer } from '@/util/indexer';

eventIndexer.start();

const server = app.listen(app.get('port'));

export default server;
