#!/usr/bin/python

import leidenalg
import igraph as ig
import json
import numpy as np
import copy

# Clean input
TRANSLATE = {
    "slatestarcodex.com" : "astralcodexten.substack.com",
    "the-diplomat.com" : "thediplomat.com",
    "redstate.org" : "redstate.com",
    "nelslindahl.net" : "nelslindahl.com",
    "aei.org/publication/blog/carpe-diem": "aei.org/blog/carpe-diem",
    "amlibpub.com" : "amlibpub.blogspot.com",
    "cafehayek.typepad.com/hayek" : "cafehayek.com",
    "cafehayek.typepad.com" : "cafehayek.com",
    "globalguerrillas.typepad.com/globalguerrillas" : "globalguerrillas.typepad.com",
    "stat.columbia.edu/~cook/movabletype/mlm" : "statmodeling.stat.columbia.edu",
    "stat.columbia.edu/~gelman/blog" : "statmodeling.stat.columbia.edu",
    "delong.typepad.com" : "braddelong.substack.com",
    "economistsview.typepad.com/economistsview" : "economistsview.typepad.com",
    "pjmedia.com/instapundit" : "instapundit.com",
    "stumblingandmumbling.typepad.com/stumbling_and_mumbling": "stumblingandmumbling.typepad.com",
    "andrewgelman.com": "statmodeling.stat.columbia.edu",
    "taxprof.typepad.com/taxprof_blog": "taxprof.typepad.com",
    "gnxp.com/": "razib.substack.com",
    "io9.com": "gizmodo.com/io9"
}

PREFIXES = [
    "https://www."
    "http://www."
    "https://"
    "http://"
    "www."
]

def get_root(s):
    s = s.strip()
    s = s.strip('/')
    return s

def clean(s):
    s = s.strip()
    s = s.strip('/')
    if s.startswith("["):
        node = True
        s = s.strip("[]")
    else:
        node = False
    
    for p in PREFIXES:
        s = s.removeprefix(p)
    s = s.strip('/')
    
    if s in TRANSLATE:
        s = TRANSLATE[s]
    
    return s, node


def main(txtfile, todofile, filter=True):
    # Read current file
    f = open(txtfile, "r")
    lines = f.readlines()
    
    # Make graph
    g = ig.Graph(directed=True)
    nodes = []
    bnodes = []
    cur_node = ""
    for l in lines:
        s,n = clean(l)
        if not s in nodes:
            nodes.append(s)
            g.add_vertex(s)
        if n:
            cur_node = s
            bnodes.append(s)
        else:
            g.add_edge(cur_node,s)
    g0 = copy.deepcopy(g)
    
    # Remove singletons
    if filter:
        old_len = 0
        while len(g.vs) != old_len:
            old_len = len(g.vs)
            to_delete_ids = [v.index for v in g.vs if len(g.neighbors(v,mode="in"))==1 and len(g.neighbors(v,mode="out"))==0]
            # [print(g.vs[i]) for i in to_delete_ids]
            g.delete_vertices(to_delete_ids)
    
    # Find communities
    part = leidenalg.find_partition(g, leidenalg.RBConfigurationVertexPartition, resolution_parameter = 1.0)
    part_dic = dict()
    for (pn,p) in enumerate(part):
        for i in p:
            part_dic[i] = pn
            
    print(ig.summary(g))
    [print(len(p)) for p in part];
    
    #Write out to json
    nodes_v = []
    links_v = []
    for (i,v) in enumerate(g.vs):
        nodes_v.append({
            "id": v["name"],
            "group": part_dic[i],
            "size": len(g.neighbors(v,mode="in"))
        })
        outn = g.neighbors(v,mode="out")
        for on in outn:
            links_v.append({
                "source": v["name"],
                "target": g.vs[on]["name"],
                "value": 1,
            })
    d = {
        "nodes": nodes_v,
        "links": links_v
    }
    with open('dat.json', 'w') as outfile:
        json.dump(d, outfile, indent=2)

    #Write out to-do
    anodes = [n for n in nodes if n not in bnodes]
    scores = [len(g0.neighbors(g0.vs.find(n),mode="in")) for n in anodes]
    s_sort = np.flip(np.argsort(scores))
    with open(todofile, 'w') as f:
        for s in s_sort:
            print("[" + anodes[s] + "]", file=f)
            
    #Write out new blogs.txt
    anodes = [n for n in nodes if n not in bnodes]
    scores = [len(g0.neighbors(g0.vs.find(n),mode="in")) for n in anodes]
    s_sort = np.flip(np.argsort(scores))
    with open(todofile, 'w') as f:
        for s in s_sort:
            print("[" + anodes[s] + "]", file=f)
            

if __name__ == '__main__':
    main('blogs.txt','blogs_todo.txt')