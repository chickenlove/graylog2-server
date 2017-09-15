import Reflux from 'reflux';

import URLUtils from 'util/URLUtils';
import ApiRoutes from 'routing/ApiRoutes';
import fetch from 'logic/rest/FetchProvider';
import UserNotification from 'util/UserNotification';

import CombinedProvider from 'injection/CombinedProvider';

const { SearchStore } = CombinedProvider.get('Search');
const { FieldQuickValuesActions } = CombinedProvider.get('FieldQuickValues');

const FieldQuickValuesStore = Reflux.createStore({
  listenables: [FieldQuickValuesActions],

  get(field) {
    this.trigger({ loading: true });
    const originalSearchURLParams = SearchStore.getOriginalSearchURLParams();
    const streamId = SearchStore.searchInStream ? SearchStore.searchInStream.id : null;

    const rangeType = originalSearchURLParams.get('rangetype');
    const timerange = {};
    switch (rangeType) {
      case 'relative':
        timerange.range = originalSearchURLParams.get('relative');
        break;
      case 'absolute':
        timerange.from = originalSearchURLParams.get('from');
        timerange.to = originalSearchURLParams.get('to');
        break;
      case 'keyword':
        timerange.keyword = originalSearchURLParams.get('keyword');
        break;
      default:
      // Do nothing
    }

    const url = ApiRoutes.UniversalSearchApiController.fieldTerms(
      rangeType,
      originalSearchURLParams.get('q') || '*',
      field,
      timerange,
      streamId,
    ).url;

    const promise = fetch('GET', URLUtils.qualifyUrl(url));
    promise.then(
      (response) => {
        this.trigger({ data: response, loading: false });
      },
      (error) => {
        UserNotification.error(`Loading quick values failed with status: ${error}`,
          'Could not load quick values');
      },
    );

    FieldQuickValuesActions.get.promise(promise);
  },
});

export default FieldQuickValuesStore;
