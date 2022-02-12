import leidenalg
import igraph as ig
G = ig.Graph.Erdos_Renyi(100, 0.1);
part = leidenalg.find_partition(G, leidenalg.ModularityVertexPartition);

ig.plot(part)