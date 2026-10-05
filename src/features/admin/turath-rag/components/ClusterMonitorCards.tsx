import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  HardDrive,
  Cpu,
  Plus,
  Trash2,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { ClusterInfo } from '../types';
import { getCollectionDetails } from '../collectionsData';
import { removeCluster, deleteCollectionOnCluster, fetchCollectionsMeta } from '../turathRagApi';
import { AddClusterModal } from './AddClusterModal';
import { CreateCollectionModal } from './CreateCollectionModal';
import { CollectionBooksModal } from './CollectionBooksModal';

interface ClusterMonitorCardsProps {
  clusters: ClusterInfo[];
  totalPoints: number;
  totalCollections: number;
  isLoading: boolean;
  onRefresh: () => void;
  onReassignCollection?: (collectionName: string, targetClusterId: string) => Promise<any>;
}

export const ClusterMonitorCards: React.FC<ClusterMonitorCardsProps> = ({
  clusters,
  totalPoints,
  totalCollections,
  isLoading,
  onRefresh,
  onReassignCollection
}) => {
  // Modal states
  const [isAddClusterOpen, setIsAddClusterOpen] = useState(false);
  const [createCollCluster, setCreateCollCluster] = useState<{ id: string; name: string } | null>(null);
  const [viewBooksColl, setViewBooksColl] = useState<{ clusterId: string; clusterName: string; collName: string } | null>(null);

  // Collections dynamic metadata (Arabic names, icons)
  const [collectionsMeta, setCollectionsMeta] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchCollectionsMeta().then(setCollectionsMeta).catch(console.error);
  }, [clusters, totalCollections]);

  // Deletion loading states
  const [deletingClusterId, setDeletingClusterId] = useState<string | null>(null);
  const [deletingCollKey, setDeletingCollKey] = useState<string | null>(null);

  // 300,000 vectors with Scalar Quantization (int8) per 1GB RAM Free Tier Cluster
  const ESTIMATED_MAX_VECTORS_PER_CLUSTER = 300000;

  const handleDeleteCluster = async (cluster: ClusterInfo) => {
    const ok = window.confirm(
      `هل أنت متأكد من حذف الحساب / الكلاستر "${cluster.name}" (${cluster.id}) من لوحة التحكم؟\n(لن يتم مسح المتجهات من سحابة Qdrant إلا إذا قمت بحذف المجموعات أولاً)`
    );
    if (!ok) return;

    try {
      setDeletingClusterId(cluster.id);
      await removeCluster(cluster.id);
      onRefresh();
    } catch (e: any) {
      alert(`فشل حذف الكلاستر: ${e.message}`);
    } finally {
      setDeletingClusterId(null);
    }
  };

  const handleDeleteCollection = async (clusterId: string, collName: string) => {
    const ok = window.confirm(
      `تحذير خطير:\nهل أنت متأكد من مسح المجموعة "${collName}" بالكامل من الكلاستر ${clusterId}؟\nسيتم إسقاط جميع المتجهات وفهارس الكتب الخاصة بها ولا يمكن استرجاعها!`
    );
    if (!ok) return;

    const key = `${clusterId}:${collName}`;
    try {
      setDeletingCollKey(key);
      await deleteCollectionOnCluster(clusterId, collName);
      onRefresh();
    } catch (e: any) {
      alert(`فشل حذف المجموعة: ${e.message}`);
    } finally {
      setDeletingCollKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header with Add Cluster Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">
              إدارة حسابات وكلاسترات Qdrant السحابية (Cloud Accounts & Clusters)
            </h3>
            <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-300 border border-sky-500/30">
              {clusters.length} حسابات متصلة
            </span>
          </div>
          <p className="text-xs text-white/60 mt-0.5">
            إدارة كل حساب وكلاستر مستقل، إنشاء وحذف المجموعات، ومتابعة سجل الكتب المضافة بدقة ووقت الاستدخال
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add New Cluster / Account Button */}
          <button
            onClick={() => setIsAddClusterOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ إضافة حساب / كلاستر جديد</span>
          </button>

          {/* Refresh Status Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            <span>تحديث الحالة</span>
          </button>
        </div>
      </div>

      {/* Cluster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map((cluster) => {
          const quotaPercent = Math.min(
            100,
            Math.round((cluster.points_count / ESTIMATED_MAX_VECTORS_PER_CLUSTER) * 100)
          );
          const remainingVectors = Math.max(0, ESTIMATED_MAX_VECTORS_PER_CLUSTER - (cluster.points_count || 0));
          const isWarning = quotaPercent > 80;
          const isDeletingCluster = deletingClusterId === cluster.id;

          return (
            <div
              key={cluster.id}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#160628]/80 p-5 backdrop-blur-xl shadow-xl transition-all hover:border-white/20 flex flex-col justify-between"
            >
              {/* Top Accent Gradient Line */}
              <div
                className={`absolute top-0 right-0 left-0 h-1 ${
                  cluster.is_healthy
                    ? cluster.id === 'cluster_1'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600'
                      : cluster.id === 'cluster_2'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600'
                    : 'bg-red-500'
                }`}
              />

              <div>
                {/* Cluster Card Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        cluster.id === 'cluster_1'
                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                          : cluster.id === 'cluster_2'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                      }`}
                    >
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{cluster.name}</h4>
                        <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-mono text-white/50 border border-white/5">
                          {cluster.id}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-white/50 truncate max-w-[200px]" title={cluster.url}>
                        {cluster.url || 'qdrant.io'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Health Badge */}
                    <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 border border-white/10">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          cluster.is_healthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                        }`}
                      />
                      <span className={`text-[10px] font-bold ${cluster.is_healthy ? 'text-emerald-300' : 'text-red-300'}`}>
                        {cluster.is_healthy ? 'جاهز' : 'غير متصل'}
                      </span>
                    </div>

                    {/* Delete Cluster Button */}
                    <button
                      onClick={() => handleDeleteCluster(cluster)}
                      disabled={isDeletingCluster}
                      className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                      title="حذف هذا الحساب/الكلاستر من القائمة"
                    >
                      {isDeletingCluster ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
                    <span className="text-[11px] text-white/50 block">المجموعات (Collections)</span>
                    <span className="text-base font-bold text-white font-mono">
                      {cluster.collections?.length || 0}
                    </span>
                    <span className="text-[10px] text-white/40 block">مجموعة منشأة</span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
                    <span className="text-[11px] text-white/50 block">المساحة المتبقية</span>
                    <span className="text-base font-bold text-sky-300 font-mono">
                      {remainingVectors.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/40 block">فقرة متبقية (~{100 - quotaPercent}%)</span>
                  </div>
                </div>

                {/* Storage Quota Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/60 flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-white/40" />
                      المستهلك: {(cluster.points_count || 0).toLocaleString()} من 300 ألف
                    </span>
                    <span className={`font-mono font-bold ${isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {quotaPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50 border border-white/5">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isWarning
                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                          : 'bg-gradient-to-r from-sky-500 to-emerald-500'
                      }`}
                      style={{ width: `${Math.max(quotaPercent, 2)}%` }}
                    />
                  </div>
                </div>

                {/* Collections Management Section */}
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-white/40" />
                      المجموعات داخل هذا الكلاستر ({cluster.collections?.length || 0}):
                    </span>

                    {/* Create Collection Button */}
                    <button
                      onClick={() => setCreateCollCluster({ id: cluster.id, name: cluster.name })}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
                      title="إنشاء مجموعة جديدة داخل هذا الكلاستر"
                    >
                      <Plus className="h-3 w-3" />
                      <span>+ إنشاء مجموعة</span>
                    </button>
                  </div>

                  {/* Collections List */}
                  {cluster.collections && cluster.collections.length > 0 ? (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {cluster.collections.map((coll) => {
                        const details = getCollectionDetails(coll.name, collectionsMeta);
                        const isDeletingColl = deletingCollKey === `${cluster.id}:${coll.name}`;

                        return (
                          <div
                            key={coll.name}
                            className="group flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2 transition-all hover:bg-white/10 hover:border-white/20"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <BookOpen className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                              <div className="overflow-hidden">
                                <span className="font-semibold text-xs text-white block truncate">
                                  {details?.arabicName || coll.name}
                                </span>
                                <span className="text-[10px] font-mono text-white/40 block truncate">
                                  {coll.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Points count badge */}
                              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-sky-300 border border-sky-500/30">
                                {(coll.points_count || 0).toLocaleString()}
                              </span>

                              {/* View Ingested Books Button */}
                              <button
                                onClick={() =>
                                  setViewBooksColl({
                                    clusterId: cluster.id,
                                    clusterName: cluster.name,
                                    collName: coll.name
                                  })
                                }
                                className="rounded p-1 text-white/60 hover:text-sky-300 hover:bg-white/10 transition-colors"
                                title="عرض الكتب المضافة وسجل وقت الاستدخال"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete Collection Button */}
                              <button
                                onClick={() => handleDeleteCollection(cluster.id, coll.name)}
                                disabled={isDeletingColl}
                                className="rounded p-1 text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                                title="حذف هذه المجموعة بالكامل"
                              >
                                {isDeletingColl ? (
                                  <RefreshCw className="h-3 w-3 animate-spin text-red-400" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-3 text-center">
                      <p className="text-xs text-white/40">لا توجد مجموعات منشأة في هذا الكلاستر بعد</p>
                      <button
                        onClick={() => setCreateCollCluster({ id: cluster.id, name: cluster.name })}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                      >
                        <Plus className="h-3 w-3" />
                        <span>إنشاء أول مجموعة للبدء</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Cluster Modal */}
      <AddClusterModal
        isOpen={isAddClusterOpen}
        onClose={() => setIsAddClusterOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Create Collection Modal */}
      {createCollCluster && (
        <CreateCollectionModal
          isOpen={!!createCollCluster}
          onClose={() => setCreateCollCluster(null)}
          clusterId={createCollCluster.id}
          clusterName={createCollCluster.name}
          onSuccess={onRefresh}
        />
      )}

      {/* View Ingested Books Modal */}
      {viewBooksColl && (
        <CollectionBooksModal
          isOpen={!!viewBooksColl}
          onClose={() => setViewBooksColl(null)}
          clusterId={viewBooksColl.clusterId}
          clusterName={viewBooksColl.clusterName}
          collectionName={viewBooksColl.collName}
        />
      )}
    </div>
  );
};
