package.path = package.path .. ";data/scripts/lib/?.lua"
require("stringutility")

-- number between 0 and 1 as percentage of the actual price
-- usually the price is calculated like this:
-- local price = 1000
-- local priceWithFee = price + price * fee
function GetFee(providingFaction, orderingFaction)

    if orderingFaction.index == providingFaction.index then return 0 end

    local percentage = 0;
    local relation = 0

    if onServer() then
        relation = providingFaction:getRelations(orderingFaction.index)
    else
        local player = Player()
        if providingFaction.index == player.index then
            relation = player:getRelations(orderingFaction.index)
        else
            relation = player:getRelations(providingFaction.index)
        end
    end

    percentage = 0.5 - relation / 200000;

    -- pay extra if relations are not good
    if relation < 0 then
        percentage = percentage * 1.5
    end

    return percentage
end

local overriddenRelationThreshold
local overriddenArmedThreshold

function overrideRelationThreshold(threshold)
    overriddenRelationThreshold = threshold
end

function overrideArmedThreshold(threshold)
    overriddenArmedThreshold = threshold
end

function CheckFactionInteraction(playerIndex, relationThreshold)
    local player = Player(playerIndex)
    local faction = Faction()

    if overriddenRelationThreshold then relationThreshold = overriddenRelationThreshold end
    if overriddenArmedThreshold then armedThreshold = overriddenArmedThreshold end

    local relationLevel = player:getRelations(faction.index)

    if relationLevel < relationThreshold then
        return false, "Our records say that we're not allowed to do business with you.\n\nCome back when your relations to our faction are better."%_t
    end

    return true
end
