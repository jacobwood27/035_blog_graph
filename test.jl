using Graphs
using LinearAlgebra
# using CommunityDetection
# using Plots, GraphRecipes
# using GraphPlot, Compose, Cairo

lines = readlines("blogs.txt")

# function get_root(s)
#     exts = [".com",".edu",".net",".blogspot",".org",".tumblr",".wordpress",".substack"
#             ,".typepad", ".us", ".xyz", ".co", ".eu"]
    
#     s = strip(s)
#     for e in exts
#         s = split(s,e)[1] 
#     end
#     s
# end
function get_root(s)
    s = strip(s)
    s = strip(s,'/')
    s
end

nodes = Dict{String,Int64}()
nodes_rev = Dict{Int64,String}()
i = 0
for l in lines
    n = get_root(l)
    if ~(n in keys(nodes))
        i+=1
        nodes[n] = i
        nodes_rev[i] = n
    end
end

g = SimpleDiGraph(length(nodes))
current_node = 0
for (i,l) in enumerate(lines)
    if startswith(l,"\t")
        add_edge!(g,current_node,nodes[get_root(l)])
    else
        current_node = nodes[get_root(l)]
    end
end



function community_detection_bethe(g::AbstractGraph, k::Int=-1; kmax::Int=15)
    A = adjacency_matrix(g)
    D = Diagonal(degree(g))
    r = (sum(degree(g)) / nv(g))^0.5

    Hr = Matrix((r^2-1)*I, nv(g), nv(g)) - r*A + D;
    #Hmr = Matrix((r^2-1)*I, nv(g), nv(g)) + r*A + D;
    k >= 1 && (kmax = k)
    λ, eigv = Graphs.LinAlg.eigs(Hr, which=:sum)

    # TODO eps() is chosen quite arbitrarily here, because some of eigenvalues
    # don't convert exactly to zero as they should. Some analysis could show
    # what threshold should be used instead
    q = something(findlast(x -> (x < -eps()), λ), 0)
    k > q && @warn("Using eigenvectors with positive eigenvalues,
                    some communities could be meaningless. Try to reduce `k`.")
    k < 1 && (k = q)
    k <= 1 && return fill(1, nv(g))
    labels = kmeans(collect(transpose(eigv[:,2:k])), k).assignments
    return labels
end


b = community_detection_bethe(g)






L = String[]
push!(L,"{")
push!(L,""""nodes": [""")

for v in vertices(g)
    push!(L,"""    {"id": "$v", "group": 1, "label": "$(nodes_rev[v])", "size": $(length(inneighbors(g, v)))},""")
end

push!(L,"""],""")
push!(L,""""links": [""")

for v in vertices(g)
    for n in inneighbors(g, v)
        push!(L,"""{"source": "$v", "target": "$n", "value": 1},""")
    end
end

push!(L,"""]""")
push!(L,"""}""")

open("t.json", "w") do f
    for l in L
        println(f, l)
    end
end

# graphplot(g)

# nodelabel = 1:num_vertices(g)
# gplothtml(g, arrowlengthfrac=0.01, nodelabel=nodelabel)
# draw(SVG("mygraph.svg"), gplot(g, arrowlengthfrac=0.01, ))

# {
# "nodes": [
#     {"id": "Myriel", "group": 1},
# ],
# "links": [
#     {"source": "Napoleon", "target": "Myriel", "value": 1},
# ]
# }