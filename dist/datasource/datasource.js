System.register([], function(exports_1) {
    var DOPK8SDatasource;
    return {
        setters:[],
        execute: function() {
            DOPK8SDatasource = (function () {
                function DOPK8SDatasource(instanceSettings, backendSrv, templateSrv) {
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.name = instanceSettings.name;
                    this.url = instanceSettings.url;
                    this.prometheus = instanceSettings.jsonData.prom_name;
                    this.nodesPromise = null;
                    this.deploymentsPromise = null;
                    this.daemonsetsPromise = null;
                    this.statefulsetsPromise = null;
                }
                DOPK8SDatasource.prototype.testDatasource = function () {
                    return this.backendSrv.datasourceRequest({
                        url: this.url + '/',
                        method: "GET"
                    }).then(function (response) {
                        if (response.status === 200) {
                            return { status: "success", message: "Data source is working", title: "Success" };
                        }
                    });
                };
                DOPK8SDatasource.prototype.metricFindQuery = function (query) {
                    var _this = this;
                    var interpolated = this.templateSrv.replace(query, {});
                    var queryData = interpolated.split(" ");
                    switch (queryData[0]) {
                        case 'prom':
                            return Promise.resolve([{
                                    text: this.prometheus,
                                    value: this.prometheus
                                }]);
                        case 'node':
                            return this.getNodesSingletone()
                                .then(function (nodes) {
                                return nodes.map(function (node) {
                                    return { text: node.metadata.name, value: node.metadata.name };
                                });
                            });
                        case 'namespace':
                            return this.getNamespaces()
                                .then(function (namespaces) { return namespaces.map(function (ns) {
                                return {
                                    text: ns.metadata.name,
                                    value: ns.metadata.name
                                };
                            }); });
                        case 'pod':
                            return this.getPods(queryData[1])
                                .then(function (pods) { return pods.map(function (pod) {
                                return {
                                    text: pod.metadata.name,
                                    value: pod.metadata.name
                                };
                            }); });
                        case 'deployment':
                            return this.getDeploymentsSingletone()
                                .then(function (deployments) { return deployments
                                .filter(function (deployment) { return deployment.metadata.namespace === queryData[1]; })
                                .map(function (deployment) {
                                return {
                                    text: deployment.metadata.name,
                                    value: deployment.metadata.name
                                };
                            }); });
                        case 'daemonset':
                            return this.getDaemonsetsSingletone()
                                .then(function (daemonsets) { return daemonsets
                                .filter(function (daemonset) { return daemonset.metadata.namespace === queryData[1]; })
                                .map(function (daemonset) {
                                return {
                                    text: daemonset.metadata.name,
                                    value: daemonset.metadata.name
                                };
                            }); });
                        case 'statefulset':
                            return this.getStateFulSetsSingletone()
                                .then(function (statefulsets) { return statefulsets
                                .filter(function (statefulset) { return statefulset.metadata.namespace === queryData[1]; })
                                .map(function (statefulset) {
                                return {
                                    text: statefulset.metadata.name,
                                    value: statefulset.metadata.name
                                };
                            }); });
                        case 'containers':
                            var promise = null;
                            switch (queryData[2]) {
                                case 'deployment':
                                    promise = this.getDeploymentsSingletone();
                                    break;
                                case 'daemonset':
                                    promise = this.getDaemonsetsSingletone();
                                    break;
                                case 'statefulset':
                                    promise = this.getStateFulSetsSingletone();
                                    break;
                            }
                            return promise.then(function (items) { return _this.__parseContainers(items, queryData); });
                        case 'nodeHost':
                            return this.getNodesSingletone()
                                .then(function (nodes) {
                                var node = nodes.filter(function (item) { return item.metadata.name === queryData[1]; })[0];
                                var ip = node.status.addresses.filter(function (item) { return item.type === 'InternalIP'; })[0].address;
                                return [{
                                        text: ip,
                                        value: ip
                                    }];
                            });
                        default:
                            return [];
                    }
                };
                DOPK8SDatasource.prototype.__get = function (url) {
                    return this.backendSrv.datasourceRequest({
                        url: this.url + url,
                        method: "GET",
                        headers: { "Content-Type": 'application/json' }
                    })
                        .then(function (response) {
                        return response.data;
                    }, function (error) {
                        return error;
                    });
                };
                DOPK8SDatasource.prototype.__parseContainers = function (items, queryData) {
                    var _item = items
                        .filter(function (item) { return item.metadata.namespace === queryData[1]; })
                        .filter(function (item) { return item.metadata.name === queryData[3]; });
                    if (!_item.length) {
                        return [{
                                text: '',
                                value: ''
                            }];
                    }
                    _item = _item[0];
                    var containers = _item.spec.template.spec.containers.map(function (cont) { return cont.name; });
                    var result = [];
                    if (containers.length > 1) {
                        var names = containers.join('|');
                        result.push({
                            text: 'All',
                            value: names
                        });
                    }
                    containers.forEach(function (cont) {
                        result.push({
                            text: cont,
                            value: cont
                        });
                    });
                    return result;
                };
                DOPK8SDatasource.prototype.__addNamespace = function (namespace) {
                    return namespace ? 'namespaces/' + namespace + '/' : '';
                };
                DOPK8SDatasource.prototype.getNamespaces = function () {
                    return this.__get('/api/v1/namespaces')
                        .then(function (result) {
                        return result.items;
                    });
                };
                DOPK8SDatasource.prototype.getDeployments = function (namespace) {
                    if (namespace === void 0) { namespace = null; }
                    return this.__get('/apis/extensions/v1beta1/' + this.__addNamespace(namespace) + 'deployments')
                        .then(function (result) {
                        return result.items;
                    });
                };
                DOPK8SDatasource.prototype.getStatefulsets = function (namespace) {
                    if (namespace === void 0) { namespace = null; }
                    return this.__get('/apis/apps/v1/' + this.__addNamespace(namespace) + 'statefulsets')
                        .then(function (result) {
                        return result.items;
                    });
                };
                DOPK8SDatasource.prototype.getDaemonsets = function (namespace) {
                    if (namespace === void 0) { namespace = null; }
                    return this.__get('/apis/extensions/v1beta1/' + this.__addNamespace(namespace) + 'daemonsets')
                        .then(function (result) {
                        return result.items;
                    });
                };
                DOPK8SDatasource.prototype.getPods = function (namespace) {
                    return this.__get('/api/v1/' + this.__addNamespace(namespace) + 'pods')
                        .then(function (result) {
                        return result.items;
                    });
                };
                DOPK8SDatasource.prototype.getServices = function (namespace) {
                    return this.__get('/api/v1/' + this.__addNamespace(namespace) + 'services')
                        .then(function (result) {
                        return result.items;
                    });
                };
                DOPK8SDatasource.prototype.getComponents = function () {
                    return this.__get('/api/v1/componentstatuses')
                        .then(function (result) {
                        return result.items;
                    });
                };
                DOPK8SDatasource.prototype.getNodesSingletone = function () {
                    if (!this.nodesPromise) {
                        this.nodesPromise = this.__get('/api/v1/nodes')
                            .then(function (nodes) {
                            return nodes.items;
                        });
                    }
                    return this.nodesPromise;
                };
                DOPK8SDatasource.prototype.getDeploymentsSingletone = function (namespace) {
                    if (namespace === void 0) { namespace = null; }
                    if (!this.deploymentsPromise) {
                        this.deploymentsPromise = this.__get('/apis/extensions/v1beta1/' + this.__addNamespace(namespace) + 'deployments')
                            .then(function (result) {
                            return result.items;
                        });
                    }
                    return this.deploymentsPromise;
                };
                DOPK8SDatasource.prototype.getDaemonsetsSingletone = function (namespace) {
                    if (namespace === void 0) { namespace = null; }
                    if (!this.daemonsetsPromise) {
                        this.daemonsetsPromise = this.__get('/apis/extensions/v1beta1/' + this.__addNamespace(namespace) + 'daemonsets')
                            .then(function (result) {
                            return result.items;
                        });
                    }
                    return this.daemonsetsPromise;
                };
                DOPK8SDatasource.prototype.getStateFulSetsSingletone = function (namespace) {
                    if (namespace === void 0) { namespace = null; }
                    if (!this.statefulsetsPromise) {
                        this.statefulsetsPromise = this.__get('/apis/apps/v1/' + this.__addNamespace(namespace) + 'statefulsets')
                            .then(function (result) {
                            return result.items;
                        });
                    }
                    return this.statefulsetsPromise;
                };
                DOPK8SDatasource.prototype.getNodes = function () {
                    return this.__get('/api/v1/nodes')
                        .then(function (nodes) {
                        return nodes.items;
                    });
                };
                DOPK8SDatasource.prototype.getJobs = function () {
                    return this.__get('/apis/batch/v1/jobs')
                        .then(function (result) {
                        return result.items;
                    });
                };
                DOPK8SDatasource.prototype.getCronJobs = function () {
                    return this.__get('/apis/batch/v1beta1/cronjobs')
                        .then(function (result) {
                        return result.items;
                    });
                };
                return DOPK8SDatasource;
            })();
            exports_1("DOPK8SDatasource", DOPK8SDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map