///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(["app/core/app_events", "../common/types/pod", "../common/proxies/prometheusProxy", "../common/constants", "../common/types/component", "../common/types/service", "../common/types/job", "../common/types/cronjob", "../common/types/namespace", "../common/store", "../common/types/deployment", "../common/types/statefulset", "../common/types/daemonset", "../common/types/node", "../common/helpers"], function(exports_1) {
    var app_events_1, pod_1, prometheusProxy_1, constants_1, component_1, service_1, job_1, cronjob_1, namespace_1, store_1, deployment_1, statefulset_1, daemonset_1, node_1, helpers_1;
    var REFRESH_RATE_DEFAULT, K8sPage;
    return {
        setters:[
            function (app_events_1_1) {
                app_events_1 = app_events_1_1;
            },
            function (pod_1_1) {
                pod_1 = pod_1_1;
            },
            function (prometheusProxy_1_1) {
                prometheusProxy_1 = prometheusProxy_1_1;
            },
            function (constants_1_1) {
                constants_1 = constants_1_1;
            },
            function (component_1_1) {
                component_1 = component_1_1;
            },
            function (service_1_1) {
                service_1 = service_1_1;
            },
            function (job_1_1) {
                job_1 = job_1_1;
            },
            function (cronjob_1_1) {
                cronjob_1 = cronjob_1_1;
            },
            function (namespace_1_1) {
                namespace_1 = namespace_1_1;
            },
            function (store_1_1) {
                store_1 = store_1_1;
            },
            function (deployment_1_1) {
                deployment_1 = deployment_1_1;
            },
            function (statefulset_1_1) {
                statefulset_1 = statefulset_1_1;
            },
            function (daemonset_1_1) {
                daemonset_1 = daemonset_1_1;
            },
            function (node_1_1) {
                node_1 = node_1_1;
            },
            function (helpers_1_1) {
                helpers_1 = helpers_1_1;
            }],
        execute: function() {
            REFRESH_RATE_DEFAULT = 60000;
            K8sPage = (function () {
                function K8sPage($scope, backendSrv, datasourceSrv, $location, timeout, $q) {
                    this.nodesMapReady = false;
                    //common store
                    this.storePods = [];
                    this.storeComponents = [];
                    this.storeServices = [];
                    this.storeJobs = [];
                    this.storeCronJobs = [];
                    this.storeDeployments = [];
                    this.storeStatefulSets = [];
                    this.storeDaemonSets = [];
                    this.namespaceMap = [];
                    this.nodesMap = [];
                    this.$q = $q;
                    this.$scope = $scope;
                    this.pageReady = false;
                    this.location = $location;
                    this.backendSrv = backendSrv;
                    this.datasourceSrv = datasourceSrv;
                    this.timeout = timeout;
                    if (!("clusterId" in $location.search())) {
                        app_events_1.default.emit('alert-error', ['Cluster not specified']);
                        return;
                    }
                    document.title = 'DevOpsProdigy KubeGraf';
                }
                K8sPage.prototype.updatePods = function (pods) {
                };
                ;
                K8sPage.prototype.getNodeDashboardLink = function (node) {
                    var dbUrl = 'dashboard/db/devopsprodigy-kubegraf-nodes-dashboard?orgId=1';
                    dbUrl += '&' + 'var-cluster=' + this.cluster.name;
                    dbUrl += '&' + 'var-node=' + node.name;
                    return dbUrl;
                };
                K8sPage.prototype.getPodDashboardLink = function (pod) {
                    var dbUrl = 'dashboard/db/devopsprodigy-kubegraf-pods-dashboard?orgId=1';
                    dbUrl += '&' + 'var-cluster=' + this.cluster.name;
                    dbUrl += '&' + 'var-namespace=' + pod.data.metadata.namespace;
                    dbUrl += '&' + 'var-pod=' + pod.name;
                    return dbUrl;
                };
                K8sPage.prototype.getEntityDashboardLink = function (entity, name) {
                    var entityName = name.substring(0, name.length - 1);
                    var dbUrl = 'dashboard/db/devopsprodigy-kubegraf-' + name + '-dashboard?orgId=1';
                    dbUrl += '&' + 'var-cluster=' + this.cluster.name;
                    dbUrl += '&' + 'var-namespace=' + entity.data.metadata.namespace;
                    dbUrl += '&' + 'var-' + entityName + '=' + entity.name;
                    return dbUrl;
                };
                K8sPage.prototype.getNodeMap = function (withoutPods) {
                    var _this = this;
                    if (withoutPods === void 0) { withoutPods = false; }
                    var _promises = [];
                    _promises.push(this.getNodes());
                    if (!withoutPods)
                        _promises.push(this.getPods(true));
                    return this.$q.all(_promises)
                        .then(function () {
                        if (!withoutPods) {
                            _this.insertPodsToNodesMap(_this.storePods);
                            _this.getPodsMetrics();
                        }
                        _this.timeout(function () {
                            _this.refreshNodes();
                        }, _this.refreshRate);
                    });
                };
                K8sPage.prototype.getResourcesMetrics = function () {
                    var _this = this;
                    var _promises = [];
                    _promises.push(this.__getCpuMetricsRequested());
                    _promises.push(this.__getMemoryMetricsRequested());
                    _promises.push(this.__getPodsCountMetrics());
                    _promises.push(this.__getCpuMetricsUsed());
                    _promises.push(this.__getMemoryMetricsUsed());
                    return this.$q.all(_promises)
                        .then(function (results) {
                        _this.nodesMap.forEach(function (node) {
                            node.parseMetrics(results[0], results[1], results[2], results[3], results[4]);
                        });
                        _this.timeout(function () {
                            _this.getResourcesMetrics();
                        }, _this.refreshRate);
                    });
                };
                K8sPage.prototype.__getCpuMetricsUsed = function () {
                    var promQuery = {
                        expr: 'sum(rate(container_cpu_usage_seconds_total[1m])) by (node)',
                        legend: 'node'
                    };
                    return this.prometheusDS.query(promQuery)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.__getCpuMetricsRequested = function () {
                    var promQuery = {
                        expr: 'sum(kube_pod_container_resource_requests_cpu_cores) by (node)',
                        legend: 'node'
                    };
                    return this.prometheusDS.query(promQuery)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.__getMemoryMetricsRequested = function () {
                    var promQuery = {
                        expr: 'sum(kube_pod_container_resource_requests_memory_bytes) by (node)',
                        legend: "node"
                    };
                    return this.prometheusDS.query(promQuery)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.__getMemoryMetricsUsed = function () {
                    var promQuery = {
                        expr: 'sum(container_memory_usage_bytes{container_name!="POD",container_name!=""})by(node)',
                        legend: 'node'
                    };
                    return this.prometheusDS.query(promQuery)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.__getPodsCountMetrics = function () {
                    var promQuery = {
                        expr: 'sum(kubelet_running_pod_count) by (node)',
                        legend: 'node'
                    };
                    return this.prometheusDS.query(promQuery)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.getNodes = function () {
                    var _this = this;
                    return this.clusterDS.getNodes()
                        .then(function (nodes) {
                        var nodeStore = [];
                        var getStore = store_1.default.getObject('nodeStore');
                        if (getStore) {
                            nodeStore = getStore;
                        }
                        nodes.forEach(function (node) {
                            var nd = new node_1.Node(node);
                            _this.nodesMap.push(nd);
                            var index = nodeStore.findIndex(function (item) { return item.name === nd.name; });
                            if (index > -1) {
                                nd.open = nodeStore[index].open;
                            }
                            else {
                                nodeStore.push({ name: nd.name, open: nd.open });
                            }
                        });
                        store_1.default.setObject('nodeStore', nodeStore);
                    });
                };
                K8sPage.prototype.getPodsMetrics = function () {
                    var _this = this;
                    var _promises = [];
                    _promises.push(this.__getPodsUsedCpu());
                    _promises.push(this.__getPodsUsedMemory());
                    _promises.push(this.__getPodsRequestedCpu());
                    _promises.push(this.__getPodsRequestedMemory());
                    this.$q.all(_promises)
                        .then(function (results) {
                        _this.nodesMap.forEach(function (node) {
                            node.namespaces.map(function (namespace) {
                                namespace.pods.map(function (pod) {
                                    var cpu = results[0].filter(function (item) { return item.target === pod.name; })[0];
                                    var mem = results[1].filter(function (item) { return item.target === pod.name; })[0];
                                    var cpuReq = results[2].filter(function (item) { return item.target === pod.name; })[0];
                                    var memReq = results[3].filter(function (item) { return item.target === pod.name; })[0];
                                    if (cpu !== undefined) {
                                        pod.metrics.cpuUsed = helpers_1.__convertToMicro(cpu.datapoint.toFixed(3));
                                    }
                                    if (mem !== undefined) {
                                        pod.metrics.memoryUsed = helpers_1.__convertToGB(mem.datapoint);
                                    }
                                    if (cpuReq !== undefined) {
                                        pod.metrics.cpuRequested = helpers_1.__convertToMicro(helpers_1.__roundCpu(cpuReq.datapoint));
                                    }
                                    if (memReq !== undefined) {
                                        pod.metrics.memoryRequested = helpers_1.__convertToGB(memReq.datapoint);
                                    }
                                });
                            });
                        });
                        _this.timeout(function () {
                            _this.getPodsMetrics();
                        }, _this.refreshRate);
                    });
                };
                K8sPage.prototype.__getPodsUsedCpu = function () {
                    var podsUsedCpu = {
                        expr: 'sum(rate(container_cpu_usage_seconds_total{pod_name!=""}[1m])) by (pod_name)',
                        legend: 'pod_name'
                    };
                    return this.prometheusDS.query(podsUsedCpu)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.__getPodsUsedMemory = function () {
                    var podsUsedMemory = {
                        expr: 'sum (container_memory_usage_bytes{container_name!="", container_name!="POD"}) by (pod_name)',
                        legend: 'pod_name'
                    };
                    return this.prometheusDS.query(podsUsedMemory)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.__getPodsRequestedCpu = function () {
                    var podsUsedCpu = {
                        expr: 'sum(kube_pod_container_resource_requests_cpu_cores) by (pod)',
                        legend: 'pod'
                    };
                    return this.prometheusDS.query(podsUsedCpu)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.__getPodsRequestedMemory = function () {
                    var podsUsedMemory = {
                        expr: 'sum(kube_pod_container_resource_requests_memory_bytes) by (pod)',
                        legend: 'pod'
                    };
                    return this.prometheusDS.query(podsUsedMemory)
                        .then(function (res) { return res; });
                };
                K8sPage.prototype.insertPodsToNodesMap = function (pods) {
                    this.nodesMap.forEach(function (node) {
                        var filterPods = pods.filter(function (pod) { return pod.data.status.hostIP === node.hostIp; });
                        filterPods.forEach(function (pod) {
                            var _nsIsset = node.namespaces.filter(function (item) {
                                return item.name === pod.data.metadata.namespace;
                            });
                            if (_nsIsset.length === 0) {
                                var _ns_1 = {
                                    name: pod.data.metadata.namespace,
                                    pods: [],
                                    limit: constants_1.PODS_LIMIT
                                };
                                node.namespaces.push(_ns_1);
                            }
                            var _ns = node.namespaces.filter(function (item) {
                                return item.name === pod.data.metadata.namespace;
                            })[0];
                            _ns.pods.push(pod);
                        });
                    });
                };
                K8sPage.prototype.refreshNodes = function () {
                    var _this = this;
                    this.clusterDS.getNodes()
                        .then(function (nodes) {
                        return _this.nodesMap.forEach(function (issetNode) {
                            var equalNode = nodes.filter(function (item) {
                                return item.metadata.uid === issetNode.data.metadata.uid;
                            });
                            if (equalNode.length > 0) {
                                equalNode = equalNode[0];
                                issetNode.update(equalNode);
                            }
                        });
                    })
                        .then(function () {
                        _this.timeout(function () {
                            _this.refreshNodes();
                        }, _this.refreshRate);
                    });
                };
                K8sPage.prototype.getNamespaceMap = function () {
                    var _this = this;
                    this.clusterDS.getNamespaces()
                        .then(function (namespaces) {
                        var namespaceStore = [];
                        var getStore = store_1.default.getObject('namespaceStore');
                        if (getStore) {
                            namespaceStore = getStore;
                        }
                        namespaces.forEach(function (namespace) {
                            var ns = new namespace_1.Namespace(namespace);
                            _this.namespaceMap.push(ns);
                            var index = namespaceStore.findIndex(function (item) { return item.name === ns.name; });
                            if (index > -1) {
                                ns.open = namespaceStore[index].open;
                            }
                            else {
                                namespaceStore.push({ name: ns.name, open: ns.open });
                            }
                        });
                        store_1.default.setObject('namespaceStore', namespaceStore);
                        var _promises = [];
                        _promises.push(_this.attachDeployments());
                        _promises.push(_this.attachStatefulsets());
                        _promises.push(_this.attachDaemonsets());
                        _promises.push(_this.getClusterCronJobs());
                        _promises.push(_this.getClusterJobs());
                        _this.$q.all(_promises)
                            .then(function () {
                            _this.attachJobs();
                            _this.attachCronJobs();
                            var _psPromises = [];
                            _psPromises.push(_this.getAllServices());
                            _psPromises.push(_this.getPods());
                            _this.$q.all(_psPromises)
                                .then(function () {
                                _this.attachPodsToMap();
                                _this.namespaceMapReady = true;
                            });
                        });
                    });
                };
                K8sPage.prototype.attachDeployments = function () {
                    var _this = this;
                    return this.clusterDS.getDeployments()
                        .then(function (deployments) {
                        deployments.forEach(function (item) {
                            var deploy = new deployment_1.Deployment(item);
                            var _ns = _this.__getNamespace(item.metadata.namespace);
                            _this.storeDeployments.push(deploy);
                            _ns.deployments.push(deploy);
                        });
                    }).then(this.timeout(function () {
                        _this.refreshDeployments();
                    }, this.refreshRate));
                };
                K8sPage.prototype.refreshDeployments = function () {
                    var _this = this;
                    this.clusterDS.getDeployments()
                        .then(function (newDeployments) {
                        _this.storeDeployments.filter(function (deployment) {
                            return !deployment.is_deleted;
                        }).forEach(function (issetDeployment) {
                            var equalDeployment = newDeployments.filter(function (item) {
                                return item.metadata.uid === issetDeployment.data.metadata.uid;
                            });
                            if (equalDeployment.length > 0) {
                                equalDeployment = equalDeployment[0];
                            }
                            else {
                                equalDeployment = false;
                            }
                            if (equalDeployment !== false) {
                                issetDeployment.update(equalDeployment);
                                newDeployments.splice(newDeployments.indexOf(equalDeployment), 1);
                            }
                            else {
                                issetDeployment.destroy();
                            }
                        });
                        newDeployments = newDeployments.map(function (newDeployment) { return new deployment_1.Deployment(newDeployment); });
                        _this.storeDeployments = _this.storeDeployments.concat(newDeployments);
                        newDeployments.forEach(function (newDeployment) {
                            var _ns = _this.__getNamespace(newDeployment.data.metadata.namespace);
                            _ns.deployments.push(newDeployment);
                        });
                    }).then(this.timeout(function () {
                        _this.refreshDeployments();
                    }, this.refreshRate));
                };
                ;
                K8sPage.prototype.attachStatefulsets = function () {
                    var _this = this;
                    return this.clusterDS.getStatefulsets()
                        .then(function (statefulsets) {
                        statefulsets.forEach(function (item) {
                            var _ns = _this.__getNamespace(item.metadata.namespace);
                            var ss = new statefulset_1.Statefulset(item);
                            _ns.statefulsets.push(ss);
                            _this.storeStatefulSets.push(ss);
                        });
                    }).then(this.timeout(function () {
                        _this.refreshStatefulsets();
                    }, this.refreshRate));
                };
                K8sPage.prototype.refreshStatefulsets = function () {
                    var _this = this;
                    this.clusterDS.getStatefulsets()
                        .then(function (Statefulsets) {
                        _this.storeStatefulSets.filter(function (statefulset) {
                            return !statefulset.is_deleted;
                        }).forEach(function (issetStatefulset) {
                            var equalStatefulset = Statefulsets.filter(function (item) {
                                return item.metadata.uid === issetStatefulset.data.metadata.uid;
                            });
                            if (equalStatefulset.length > 0) {
                                equalStatefulset = equalStatefulset[0];
                            }
                            else {
                                equalStatefulset = false;
                            }
                            if (equalStatefulset !== false) {
                                issetStatefulset.update(equalStatefulset);
                                Statefulsets.splice(Statefulsets.indexOf(equalStatefulset), 1);
                            }
                            else {
                                issetStatefulset.destroy();
                            }
                        });
                        Statefulsets = Statefulsets.map(function (newStatefulset) { return new statefulset_1.Statefulset(newStatefulset); });
                        _this.storeStatefulSets = _this.storeStatefulSets.concat(Statefulsets);
                        Statefulsets.forEach(function (newStatefulset) {
                            var _ns = _this.__getNamespace(newStatefulset.data.metadata.namespace);
                            _ns.statefulsets.push(newStatefulset);
                        });
                    }).then(this.timeout(function () {
                        _this.refreshStatefulsets(); //expr: 'sum(kube_pod_container_resource_requests_memory_bytes) by (pod)',
                    }, this.refreshRate));
                };
                ;
                K8sPage.prototype.attachDaemonsets = function () {
                    var _this = this;
                    return this.clusterDS.getDaemonsets()
                        .then(function (daemonsets) {
                        daemonsets.forEach(function (item) {
                            var _ns = _this.__getNamespace(item.metadata.namespace);
                            var ds = new daemonset_1.Daemonset(item);
                            _ns.daemonsets.push(ds);
                            _this.storeDaemonSets.push(ds);
                        });
                    }).then(this.timeout(function () {
                        _this.refreshDaemonsets();
                    }, this.refreshRate));
                };
                K8sPage.prototype.refreshDaemonsets = function () {
                    var _this = this;
                    this.clusterDS.getDaemonsets()
                        .then(function (Daemonsets) {
                        _this.storeDaemonSets.filter(function (daemonset) {
                            return !daemonset.is_deleted;
                        }).forEach(function (issetDaemonSet) {
                            var equalDaemonSet = Daemonsets.filter(function (item) {
                                return item.metadata.uid === issetDaemonSet.data.metadata.uid;
                            });
                            if (equalDaemonSet.length > 0) {
                                equalDaemonSet = equalDaemonSet[0];
                            }
                            else {
                                equalDaemonSet = false;
                            }
                            if (equalDaemonSet !== false) {
                                issetDaemonSet.update(equalDaemonSet);
                                Daemonsets.splice(Daemonsets.indexOf(equalDaemonSet), 1);
                            }
                            else {
                                issetDaemonSet.destroy();
                            }
                        });
                        Daemonsets = Daemonsets.map(function (newDaemonset) { return new daemonset_1.Daemonset(newDaemonset); });
                        _this.storeDaemonSets = _this.storeDaemonSets.concat(Daemonsets);
                        Daemonsets.forEach(function (newDaemonset) {
                            var _ns = _this.__getNamespace(newDaemonset.data.metadata.namespace);
                            _ns.daemonsets.push(newDaemonset);
                        });
                    }).then(this.timeout(function () {
                        _this.refreshDaemonsets();
                    }, this.refreshRate));
                };
                ;
                K8sPage.prototype.attachJobs = function () {
                    var _this = this;
                    this.namespaceMap.forEach(function (ns) {
                        var jobsList = _this.storeJobs.filter(function (job) { return !job.data.metadata.ownerReferences && job.data.metadata.namespace === ns.name; });
                        var ns_crons = _this.storeCronJobs.filter(function (cron) { return cron.data.metadata.namespace === ns; });
                        ns_crons.forEach(function (cj) {
                            var uid = cj.data.metadata.uid;
                            _this.storeJobs.forEach(function (job) {
                                if (job.data.metadata.ownerReferences) {
                                    if (!job.data.metadata.ownerReferences.filter(function (item) { return item.kind === 'CronJob' && item.uid === uid; })[0]) {
                                        jobsList.push(job);
                                    }
                                }
                            });
                        });
                        ns.jobs = jobsList;
                    });
                };
                K8sPage.prototype.attachCronJobs = function () {
                    var _this = this;
                    this.namespaceMap.forEach(function (ns) {
                        ns.cronJobs = _this.storeCronJobs.filter(function (cron) { return cron.data.metadata.namespace === ns.name; });
                        ns.cronJobs.forEach(function (cj) {
                            var uid = cj.data.metadata.uid;
                            var jobsList = [];
                            _this.storeJobs.forEach(function (job) {
                                if (job.data.metadata.ownerReferences) {
                                    if (job.data.metadata.ownerReferences.filter(function (item) { return item.kind === 'CronJob' && item.uid === uid; })[0]) {
                                        jobsList.push(job);
                                    }
                                }
                            });
                            cj.jobs = jobsList;
                        });
                    });
                };
                K8sPage.prototype.attachPodsToMap = function () {
                    var _this = this;
                    this.namespaceMap.forEach(function (ns) {
                        ns.deployments.forEach(function (deployment) {
                            deployment.pods = _this.__findPodsBySelector(deployment.data.spec.selector.matchLabels, ns.name);
                            deployment.services = _this.__findServices(deployment);
                        });
                        ns.statefulsets.forEach(function (statefulset) {
                            statefulset.pods = _this.__findPodsBySelector(statefulset.data.spec.selector.matchLabels, ns.name);
                            statefulset.services = _this.__findServices(statefulset);
                        });
                        ns.daemonsets.forEach(function (daemonset) {
                            daemonset.pods = _this.__findPodsBySelector(daemonset.data.spec.selector.matchLabels, ns.name);
                            daemonset.services = _this.__findServices(daemonset);
                        });
                        ns.jobs.forEach(function (job) {
                            job.pods = _this.__findPodsBySelector(job.data.metadata.labels, ns.name);
                        });
                        ns.cronJobs.forEach(function (cron) {
                            cron.jobs.map(function (job) {
                                job.pods = _this.__findPodsBySelector(job.data.metadata.labels, ns.name);
                            });
                        });
                        ns.other[0].pods = _this.storePods.filter(function (item) { return !item.used && item.data.metadata.namespace === ns.name; });
                    });
                };
                K8sPage.prototype.updateJobs = function () {
                    var _this = this;
                    var _promises = [];
                    _promises.push(this.refreshJobs());
                    this.$q.all(_promises)
                        .then(function () {
                        _this.attachJobs();
                        _this.attachCronJobs();
                    });
                };
                K8sPage.prototype.__findPodsBySelector = function (filter, namespace, pods) {
                    if (pods === void 0) { pods = this.storePods; }
                    return pods.filter(function (item) {
                        return item.data.metadata.namespace === namespace;
                    }).filter(function (item) {
                        var labels = item.data.metadata.labels;
                        for (var prop in filter) {
                            if (!labels.hasOwnProperty(prop))
                                return false;
                            if (labels[prop] != filter[prop])
                                return false;
                        }
                        item.used = true;
                        return true;
                    });
                };
                K8sPage.prototype.__findServices = function (entity) {
                    var _this = this;
                    return this.storeServices.filter(function (item) {
                        if (!item.data.spec || !item.data.spec.selector)
                            return false;
                        var matchLabels = item.data.spec.selector;
                        var result = _this.__findPodsBySelector(matchLabels, item.data.metadata.namespace, entity.pods);
                        if (result.length > 0)
                            return true;
                        return false;
                    });
                };
                K8sPage.prototype.__prepareDS = function () {
                    var _this = this;
                    return this.getClusterDS(this.location.search().clusterId)
                        .then(function () {
                        _this.pageReady = true;
                    });
                };
                K8sPage.prototype.getClusterDS = function (id) {
                    var _this = this;
                    return this.backendSrv.get('/api/datasources/' + id)
                        .then(function (datasource) {
                        _this.cluster = datasource;
                        _this.__setRefreshRate(datasource.jsonData.refresh_pods_rate);
                        var _promises = [];
                        _promises.push(_this.getK8SDatasource(datasource.name));
                        _promises.push(_this.getPrometheusDS(datasource.jsonData.prom_name));
                        return _this.$q.all(_promises);
                    });
                };
                K8sPage.prototype.getK8SDatasource = function (name) {
                    var _this = this;
                    return this.datasourceSrv.get(name)
                        .then(function (ds) {
                        _this.clusterDS = ds;
                    });
                };
                K8sPage.prototype.getPrometheusDS = function (name) {
                    var _this = this;
                    return this.datasourceSrv.get(name)
                        .then(function (ds) {
                        _this.prometheusDS = new prometheusProxy_1.PrometheusProxy(ds);
                    });
                };
                K8sPage.prototype.getPods = function (skipEmptyHost) {
                    var _this = this;
                    if (skipEmptyHost === void 0) { skipEmptyHost = false; }
                    return this.clusterDS.getPods()
                        .then(function (pods) {
                        if (skipEmptyHost)
                            pods = pods.filter(function (pod) { return pod.status.hostIP != undefined; });
                        _this.storePods = pods.map(function (pod) { return new pod_1.Pod(pod); });
                        _this.timeout(function () {
                            _this.refreshPods(skipEmptyHost);
                        }, _this.refreshRate);
                    });
                };
                K8sPage.prototype.refreshPods = function (skipEmptyHost) {
                    var _this = this;
                    if (skipEmptyHost === void 0) { skipEmptyHost = false; }
                    this.clusterDS.getPods()
                        .then(function (pods) {
                        if (skipEmptyHost)
                            pods = pods.filter(function (pod) { return pod.status.hostIP != undefined; });
                        _this.storePods.filter(function (pod) {
                            return !pod.is_deleted;
                        }).forEach(function (issetPod) {
                            var equalPod = pods.filter(function (item) {
                                return item.metadata.uid === issetPod.data.metadata.uid;
                            });
                            if (equalPod.length > 0) {
                                equalPod = equalPod[0];
                            }
                            else {
                                equalPod = false;
                            }
                            if (equalPod !== false) {
                                issetPod.update(equalPod);
                                pods.splice(pods.indexOf(equalPod), 1);
                            }
                            else {
                                issetPod.destroy();
                            }
                        });
                        pods = pods.map(function (pod) { return new pod_1.Pod(pod); });
                        _this.storePods = _this.storePods.concat(pods);
                        _this.updatePods(pods);
                    });
                    this.timeout(function () {
                        _this.refreshPods(skipEmptyHost);
                    }, this.refreshRate);
                };
                K8sPage.prototype.getClusterComponents = function () {
                    var _this = this;
                    this.clusterDS.getComponents()
                        .then(function (components) {
                        _this.storeComponents = components.map(function (component) { return new component_1.Component(component); });
                        _this.timeout(function () {
                            _this.refreshClusterComponents();
                        }, _this.refreshRate);
                    });
                };
                K8sPage.prototype.refreshClusterComponents = function () {
                    var _this = this;
                    this.clusterDS.getComponents()
                        .then(function (components) {
                        _this.storeComponents = components.map(function (component) { return new component_1.Component(component); });
                        _this.timeout(function () {
                            _this.refreshClusterComponents();
                        }, _this.refreshRate);
                    });
                };
                K8sPage.prototype.getAllServices = function () {
                    var _this = this;
                    return this.clusterDS.getServices()
                        .then(function (services) {
                        _this.storeServices = services.map(function (service) { return new service_1.Service(service); });
                    });
                };
                K8sPage.prototype.getClusterJobs = function () {
                    var _this = this;
                    return this.clusterDS.getJobs()
                        .then(function (jobs) {
                        _this.storeJobs = jobs.map(function (job) { return new job_1.Job(job); });
                    });
                };
                K8sPage.prototype.getClusterCronJobs = function () {
                    var _this = this;
                    return this.clusterDS.getCronJobs()
                        .then(function (cronjobs) {
                        _this.storeCronJobs = cronjobs.map(function (cronjob) { return new cronjob_1.Cronjob(cronjob); });
                    });
                };
                K8sPage.prototype.refreshJobs = function () {
                    var _this = this;
                    return this.clusterDS.getJobs()
                        .then(function (newJobs) {
                        _this.storeJobs.filter(function (job) {
                            return !job.is_deleted;
                        }).forEach(function (issetJob) {
                            var equalPod = newJobs.filter(function (item) {
                                return item.metadata.uid === issetJob.data.metadata.uid;
                            });
                            if (equalPod.length > 0) {
                                equalPod = equalPod[0];
                            }
                            else {
                                equalPod = false;
                            }
                            if (equalPod !== false) {
                                issetJob.update(equalPod);
                                newJobs.splice(newJobs.indexOf(equalPod), 1);
                            }
                            else {
                                issetJob.destroy();
                            }
                        });
                        newJobs = newJobs.map(function (newJob) { return new job_1.Job(newJob); });
                        _this.storeJobs = _this.storeJobs.concat(newJobs);
                    });
                };
                K8sPage.prototype.__getNamespace = function (namespace) {
                    return this.namespaceMap.filter(function (ns) {
                        return ns.name === namespace;
                    })[0];
                };
                K8sPage.prototype.__setRefreshRate = function (rate) {
                    if (rate === undefined) {
                        this.refreshRate = REFRESH_RATE_DEFAULT;
                    }
                    else {
                        this.refreshRate = rate * 1000;
                    }
                };
                K8sPage.prototype.__getPodsLength = function (pods) {
                    if (pods === void 0) { pods = []; }
                    return pods.filter(function (item) { return !item.is_deleted; }).length;
                };
                K8sPage.prototype.getWarningPods = function () {
                    return this.storePods.filter(function (item) {
                        return (item.status === constants_1.WARNING || item.status === constants_1.ERROR || item.status === constants_1.TERMINATING)
                            &&
                                !item.is_deleted;
                    });
                };
                K8sPage.prototype.getWarningNodes = function () {
                    return this.nodesMap.filter(function (item) { return item.status === constants_1.ERROR; });
                };
                K8sPage.prototype.goTo = function (id) {
                    var pod = null;
                    if (id) {
                        pod = document.getElementsByClassName(id)[0];
                    }
                    if (pod) {
                        pod.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                };
                K8sPage.prototype.getAlertsNodesByCPU = function () {
                    return this.nodesMap.filter(function (item) { return item.cpuStatus === constants_1.WARNING || item.cpuStatus === constants_1.ERROR; });
                };
                K8sPage.prototype.getAlertsNodesByMemory = function () {
                    return this.nodesMap.filter(function (item) { return item.memoryStatus === constants_1.WARNING || item.memoryStatus === constants_1.ERROR; });
                };
                K8sPage.prototype.getAlertsNodesByPods = function () {
                    return this.nodesMap.filter(function (item) { return item.podsStatus === constants_1.WARNING || item.podsStatus === constants_1.ERROR; });
                };
                K8sPage.prototype.getAlertsComponents = function () {
                    return this.storeComponents.filter(function (item) { return item.status === constants_1.ERROR; });
                };
                return K8sPage;
            })();
            exports_1("K8sPage", K8sPage);
        }
    }
});
//# sourceMappingURL=k8s-page.js.map