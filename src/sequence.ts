import {inject} from '@loopback/context';
import {
  FindRoute,
  InvokeMethod,
  InvokeMiddleware,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
} from '@loopback/rest';
import {LoggerService} from './services/index';

const SequenceActions = RestBindings.SequenceActions;
export class MySequence implements SequenceHandler {
  /**
   * Optional invoker for registered middleware in a chain.
   * To be injected via SequenceActions.INVOKE_MIDDLEWARE.
   */
  @inject(SequenceActions.INVOKE_MIDDLEWARE, {optional: true})
  protected invokeMiddleware: InvokeMiddleware = () => false;

  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject('services.LoggerService') private log: LoggerService,
  ) {}

  async handle(context: RequestContext) {
    try {
      this.log.info('Start Time');

      const {request, response} = context;

      this.log.info('referer : ' + request.headers['referer']);
      this.log.info('user agent : ' + request.headers['user-agent']);
      this.log.info('request ip : ' + request.ip);

      const allowedOrigin: string[] = (process.env.ALLOWED_ORIGIN ?? '')
        .split(',')
        .map(origin => origin.trim());

      const requestOrigin: string = request.headers['host'] ?? '';
      if (!allowedOrigin.includes(requestOrigin)) {
        throw new Error('Sorry, You Are Not Allowed to Access this.');
      }

      // Invoke registered Express middleware
      const finished = await this.invokeMiddleware(context);
      if (finished) {
        // The response been produced by the middleware chain
        return;
      }
      const route = this.findRoute(request);
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);

      this.log.info('Completion Time');

      this.send(response, result);
    } catch (err) {
      this.log.error(err);
      this.log.debug(err);
      // console.error(err);

      this.reject(context, err);
    }
  }
}
